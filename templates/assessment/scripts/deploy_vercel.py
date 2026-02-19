"""
Deploy the ui/dist directory to Vercel as a static site using the Vercel REST API.
Bypasses the CLI's --scope bug in non-interactive mode.

Usage:
    python scripts/deploy_vercel.py
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SRC_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = SRC_DIR / "ui" / "dist"
AUTH_FILE = Path.home() / ".vercel" / "auth.json"

VERCEL_API = "https://api.vercel.com"
TEAM_ID = "team_WX7twz9BkV371Gow49qH1WpV"  # max-fox-jurkowitz personal projects
PROJECT_NAME = "athenahealth-ops-assessment"


def _get_token() -> str:
    """Read Vercel token from ~/.vercel/auth.json."""
    if AUTH_FILE.is_file():
        with open(AUTH_FILE) as f:
            data = json.load(f)
            token = data.get("token")
            if token:
                return token
    print("ERROR: No Vercel token found at", AUTH_FILE)
    print("Run `npx vercel login` first.")
    sys.exit(1)


def _headers(token: str) -> dict:
    """Standard Vercel API headers."""
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _params() -> dict:
    """Query params, including teamId if configured."""
    if TEAM_ID:
        return {"teamId": TEAM_ID}
    return {}


def _ensure_project(token: str) -> str:
    """Create the Vercel project if it doesn't exist, return project ID."""
    # Check if project exists
    r = requests.get(
        f"{VERCEL_API}/v9/projects/{PROJECT_NAME}",
        headers=_headers(token),
        params=_params(),
    )
    if r.status_code == 200:
        proj = r.json()
        print(f"Project '{PROJECT_NAME}' exists (id: {proj['id']})")
        return proj["id"]

    # Create project
    print(f"Creating project '{PROJECT_NAME}'...")
    r = requests.post(
        f"{VERCEL_API}/v10/projects",
        headers=_headers(token),
        params=_params(),
        json={
            "name": PROJECT_NAME,
            "framework": None,  # static site
        },
    )
    r.raise_for_status()
    proj = r.json()
    print(f"Created project (id: {proj['id']})")
    return proj["id"]


def _collect_files(dist: Path) -> list[dict]:
    """Collect all files in dist/ with their SHA1 hashes and sizes."""
    files = []
    for fpath in sorted(dist.rglob("*")):
        if fpath.is_dir():
            continue
        rel = fpath.relative_to(dist).as_posix()
        data = fpath.read_bytes()
        sha1 = hashlib.sha1(data).hexdigest()
        files.append({
            "file": rel,
            "sha": sha1,
            "size": len(data),
            "path": str(fpath),
        })
    return files


def _deploy(token: str, project_name: str, files: list[dict]) -> str:
    """Create a deployment via the Vercel API. Returns the deployment URL."""
    # Build the file list for the API
    api_files = [{"file": f["file"], "sha": f["sha"], "size": f["size"]} for f in files]

    print(f"Creating deployment with {len(api_files)} files...")
    r = requests.post(
        f"{VERCEL_API}/v13/deployments",
        headers=_headers(token),
        params=_params(),
        json={
            "name": project_name,
            "files": api_files,
            "projectSettings": {
                "framework": None,
            },
            "target": "production",
        },
    )

    if r.status_code == 200:
        dep = r.json()
        url = dep.get("url", "")
        print(f"Deployment created: https://{url}")
        return url

    # If we get missing files, we need to upload them first
    body = r.json()
    error = body.get("error", {})
    missing = error.get("missing", []) or body.get("missing", [])
    if missing:
        print(f"Uploading {len(missing)} files...")
        sha_to_file = {f["sha"]: f for f in files}
        for m in missing:
            sha = m if isinstance(m, str) else m.get("sha", "")
            finfo = sha_to_file.get(sha)
            if not finfo:
                print(f"  WARN: no local file for sha {sha}")
                continue
            data = Path(finfo["path"]).read_bytes()
            upload_r = requests.post(
                f"{VERCEL_API}/v2/files",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/octet-stream",
                    "x-vercel-digest": sha,
                    "x-vercel-size": str(len(data)),
                },
                params=_params(),
                data=data,
            )
            if upload_r.status_code not in (200, 201):
                print(f"  WARN: upload failed for {finfo['file']}: {upload_r.status_code} {upload_r.text[:200]}")
            else:
                print(f"  Uploaded: {finfo['file']}")

        # Retry deployment after uploading files
        print("Retrying deployment...")
        r2 = requests.post(
            f"{VERCEL_API}/v13/deployments",
            headers=_headers(token),
            params=_params(),
            json={
                "name": project_name,
                "files": api_files,
                "projectSettings": {
                    "framework": None,
                },
                "target": "production",
            },
        )
        if r2.status_code != 200:
            print(f"Retry failed ({r2.status_code}): {r2.text[:500]}")
            r2.raise_for_status()
        dep = r2.json()
        url = dep.get("url", "")
        print(f"Deployment created: https://{url}")
        return url

    print(f"Deployment API error ({r.status_code}): {r.text[:500]}")
    r.raise_for_status()
    return ""


def main() -> None:
    if not DIST_DIR.is_dir():
        print(f"ERROR: {DIST_DIR} not found. Run `npm run build` first.")
        sys.exit(1)

    token = _get_token()
    _ensure_project(token)
    files = _collect_files(DIST_DIR)
    print(f"Found {len(files)} files in dist/ ({sum(f['size'] for f in files) / 1024:.0f} KB total)")

    url = _deploy(token, PROJECT_NAME, files)
    if url:
        print(f"\nDeployed successfully!")
        print(f"  URL: https://{url}")
        print(f"  Production: https://{PROJECT_NAME}.vercel.app")


if __name__ == "__main__":
    main()
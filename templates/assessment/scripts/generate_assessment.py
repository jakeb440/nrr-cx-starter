"""
Pre-compute a customer operations assessment and write it as static JSON.

Run this before `npm run build` to bake the data into the static site:
    python scripts/generate_assessment.py                  # athenahealth (default)
    python scripts/generate_assessment.py --company oracle # Oracle

Output: ui/public/assessment.json  (Vite copies public/ into dist/)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SRC_DIR))

from services.assessment import run_assessment


def main() -> None:
    """Generate the assessment JSON file for a given company."""
    parser = argparse.ArgumentParser(description="Generate assessment JSON")
    parser.add_argument(
        "--company",
        default="athenahealth",
        choices=["athenahealth", "oracle"],
        help="Company to generate assessment for (default: athenahealth)",
    )
    args = parser.parse_args()

    company_id: str = args.company
    output_path = SRC_DIR / "ui" / "public" / "assessment.json"

    print(f"Running {company_id} assessment (no network calls needed)...")
    data = run_assessment(company_id=company_id)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    size_kb = output_path.stat().st_size / 1024
    print(f"Wrote {output_path} ({size_kb:.1f} KB)")
    print("Done. Now run `npm run build` in the ui/ directory.")


if __name__ == "__main__":
    main()
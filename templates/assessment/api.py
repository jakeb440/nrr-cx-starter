"""
FastAPI backend — Salesforce Customer Ops Assessment.
Single endpoint that returns the full assessment.

Run with:
    uvicorn api:app --reload --port 3000
"""

from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()

import sys
PROJECT_ROOT = Path(__file__).parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.assessment import run_salesforce_assessment

app = FastAPI(title="Salesforce Customer Ops Assessment", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UI_DIST_PATH = (PROJECT_ROOT / "ui" / "dist").resolve()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    """Health check."""
    return {"status": "healthy"}


@app.get("/api/assessment")
async def get_assessment():
    """
    Run the full Salesforce assessment.
    Fetches SEC data, applies Salesforce-specific role estimates
    and benchmarks, returns structured JSON. No LLM required.
    """
    try:
        result = run_salesforce_assessment()
        return result
    except Exception as e:
        logger.exception("Assessment failed")
        raise HTTPException(status_code=500, detail=f"Assessment failed: {e}") from e


# ---------------------------------------------------------------------------
# Static UI serving (middleware to avoid conflicts with API routes)
# ---------------------------------------------------------------------------

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SPAMiddleware(BaseHTTPMiddleware):
    """Serve index.html for any non-API GET that would otherwise 404."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        if (
            request.method == "GET"
            and response.status_code == 404
            and not request.url.path.startswith("/api")
            and not request.url.path.startswith("/openapi")
            and not request.url.path.startswith("/docs")
        ):
            index_file = UI_DIST_PATH / "index.html"
            if index_file.is_file():
                return FileResponse(str(index_file))

        return response


# Mount the dist folder as static files
if UI_DIST_PATH.is_dir():
    app.mount("/", StaticFiles(directory=str(UI_DIST_PATH), html=True), name="spa")

# Add SPA fallback middleware
app.add_middleware(SPAMiddleware)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
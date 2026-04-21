"""Vercel serverless entry point — wraps the FastAPI app."""
import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the app — Vercel requires a top-level `app` variable
try:
    from app.main import app
except Exception as _import_error:
    import traceback
    from fastapi import FastAPI

    _error_detail = f"{type(_import_error).__name__}: {_import_error}\n{traceback.format_exc()}"

    app = FastAPI()

    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def error_handler(path: str):
        return {"error": "App failed to start", "detail": _error_detail}

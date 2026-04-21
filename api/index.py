"""Vercel serverless entry point — wraps the FastAPI app."""
import sys
import os
import traceback

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from app.main import app
except Exception as e:
    # If the app fails to import, create a minimal FastAPI that returns the error
    from fastapi import FastAPI
    app = FastAPI()

    error_msg = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"

    @app.get("/api/{path:path}")
    @app.post("/api/{path:path}")
    @app.put("/api/{path:path}")
    @app.delete("/api/{path:path}")
    async def error_handler(path: str):
        return {"error": "App failed to start", "detail": error_msg}

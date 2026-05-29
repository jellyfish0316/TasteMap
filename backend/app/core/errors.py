"""Application error types and FastAPI exception handlers.

Raise these from any layer; the handlers turn them into clean JSON responses.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base for all expected application errors."""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class AuthError(AppError):
    status_code = 401
    code = "unauthorized"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class UnsupportedSourceError(AppError):
    """No registered parser can handle the submitted URL."""

    status_code = 422
    code = "unsupported_source"


class ParseError(AppError):
    """A platform parser failed to fetch / extract content from a source."""

    status_code = 502
    code = "parse_error"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

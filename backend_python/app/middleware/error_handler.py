"""
Global Exception Handler Middleware
Verhindert Datenlecks durch sensible Fehlermeldungen
"""
import os
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

# Sensible Daten die nicht in Error Messages erscheinen sollen
SENSITIVE_PATTERNS = [
    "api_key",
    "api-key",
    "secret",
    "password",
    "token",
    "database_url",
    "connection_string",
    "jwt_secret",
]


def is_production() -> bool:
    """Prüft ob wir in Production sind"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    return env == "production"


def sanitize_error_message(message: str) -> str:
    """
    Entfernt sensible Daten aus Error Messages.
    
    Args:
        message: Die zu sanitizierende Error Message
        
    Returns:
        Sanitized Message
    """
    if not message:
        return "Ein Fehler ist aufgetreten"
    
    # Prüfe auf sensible Patterns
    message_lower = message.lower()
    for pattern in SENSITIVE_PATTERNS:
        if pattern in message_lower:
            # In Production: Generische Meldung
            if is_production():
                return "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
            # In Development: Zeige Message aber maskiere sensible Teile
            return message.replace(pattern, "[REDACTED]")
    
    return message


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global Exception Handler für alle unerwarteten Exceptions.
    """
    # Log detaillierte Fehler server-seitig
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else None,
        }
    )
    
    # In Production: Generische Fehlermeldung
    # In Development: Detailliertere Meldung
    if is_production():
        detail = "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
    else:
        detail = sanitize_error_message(str(exc))
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail}
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handler für HTTP Exceptions (FastAPI HTTPException).
    """
    # Log HTTP Exceptions
    logger.warning(
        f"HTTP Exception: {exc.status_code} - {exc.detail}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code,
        }
    )
    
    # Sanitize Error Message
    detail = sanitize_error_message(str(exc.detail))
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail}
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handler für Validation Errors (Pydantic).
    """
    # Log Validation Errors
    logger.warning(
        f"Validation Error: {exc.errors()}",
        extra={
            "path": request.url.path,
            "method": request.method,
        }
    )
    
    # In Production: Generische Meldung
    # In Development: Detaillierte Validation Errors
    if is_production():
        detail = "Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingabe."
    else:
        detail = exc.errors()
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail}
    )

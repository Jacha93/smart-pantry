import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Lade Umgebungsvariablen
load_dotenv()

from app.database import init_db
from app.routers import auth, users, groceries, recipes, shopping_lists, chat, photo_recognition
from app.middleware.error_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler
)
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.dependencies import validate_jwt_secret
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # JWT Secret Validierung beim Start
    try:
        validate_jwt_secret()
    except ValueError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.critical(f"Startup validation failed: {e}")
        raise
    
    # await init_db() # Optional: Tabellen prüfen/erstellen beim Start
    yield
    # Shutdown

app = FastAPI(
    title="Smart Pantry API",
    version="2.0.0",
    lifespan=lifespan
)

# Global Exception Handlers registrieren
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# CORS Config - Environment-basiert
# In Production: Spezifische Origins
# In Development: Erlaube localhost
is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"

if is_production:
    # Production: Spezifische Origins aus Environment Variable
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    
    if not allowed_origins:
        # Fallback: Warnung aber erlaube localhost für Migration
        import warnings
        warnings.warn(
            "ALLOWED_ORIGINS nicht gesetzt in Production! "
            "Setze ALLOWED_ORIGINS in der .env Datei (komma-separiert).",
            UserWarning
        )
        allowed_origins = ["http://localhost:3000"]  # Fallback
else:
    # Development: Erlaube localhost und common Dev-Ports
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite Default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Router einbinden
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groceries.router)
app.include_router(recipes.router)
app.include_router(shopping_lists.router)
app.include_router(chat.router)
app.include_router(photo_recognition.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 3001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
import os
from typing import Optional, AsyncGenerator
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.models import User

# Konfiguration (aus .env)
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_TTL_MS = int(os.getenv("REFRESH_TOKEN_TTL_MS", 24 * 60 * 60 * 1000)) # Default 24h

# JWT Secret Validierung
def validate_jwt_secret():
    """
    Validiert dass JWT_SECRET gesetzt ist und stark genug ist.
    Wird beim Startup aufgerufen.
    """
    if not JWT_SECRET:
        raise ValueError(
            "JWT_SECRET ist nicht gesetzt! "
            "Bitte setze JWT_SECRET in der .env Datei. "
            "Generiere ein sicheres Secret mit: openssl rand -hex 32"
        )
    
    # Prüfe auf Default/unsichere Secrets
    insecure_secrets = [
        "dev_secret_change_me",
        "secret",
        "password",
        "123456",
        "changeme",
    ]
    
    if JWT_SECRET in insecure_secrets or len(JWT_SECRET) < 32:
        is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
        if is_production:
            raise ValueError(
                "JWT_SECRET ist zu schwach für Production! "
                "Bitte verwende ein sicheres Secret mit mindestens 32 Zeichen. "
                "Generiere mit: openssl rand -hex 32"
            )
        else:
            import warnings
            warnings.warn(
                f"JWT_SECRET ist zu schwach! "
                f"Bitte verwende ein sicheres Secret mit mindestens 32 Zeichen. "
                f"Generiere mit: openssl rand -hex 32",
                UserWarning
            )

# Passwort Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 Scheme für FastAPI (erwartet Token im Header "Authorization: Bearer ...")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # User aus DB laden
    statement = select(User).where(User.id == int(user_id))
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
import secrets
import hashlib

from app.database import get_session
from app.models import User, RefreshToken
from app.schemas import UserCreate, UserRead, LoginRequest, Token, RefreshTokenRequest
from app.dependencies import get_password_hash, verify_password, create_access_token, REFRESH_TOKEN_TTL_MS

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, session: AsyncSession = Depends(get_session)):
    # Prüfen ob Email existiert
    statement = select(User).where(User.email == user_data.email)
    result = await session.execute(statement)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists"
        )
    
    # Neuen User erstellen
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        passwordHash=get_password_hash(user_data.password),
        createdAt=datetime.utcnow()
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, session: AsyncSession = Depends(get_session)):
    # User suchen
    statement = select(User).where(User.email == login_data.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Access Token erstellen
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    # Refresh Token erstellen (manuell wie im alten Backend)
    raw_refresh_token = secrets.token_hex(48)
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    expires_at = datetime.utcnow() + [(datetime.utcnow() - datetime.now()) + datetime.fromtimestamp(REFRESH_TOKEN_TTL_MS/1000) - datetime.utcnow()][0] # Fix für timedelta ms
    # Vereinfacht:
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(milliseconds=REFRESH_TOKEN_TTL_MS)

    db_refresh_token = RefreshToken(
        tokenHash=token_hash,
        userId=user.id,
        expiresAt=expires_at
    )
    session.add(db_refresh_token)
    await session.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
        "expires_in": REFRESH_TOKEN_TTL_MS / 1000
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    # 1. Token in DB suchen (über Hash)
    token_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    stmt = select(RefreshToken).where(
        RefreshToken.tokenHash == token_hash,
        RefreshToken.revokedAt == None,
        RefreshToken.expiresAt > datetime.utcnow()
    )
    result = await session.execute(stmt)
    db_token = result.scalar_one_or_none()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # 2. User laden
    user_stmt = select(User).where(User.id == db_token.userId)
    user_result = await session.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 3. Neues Access Token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    # 4. Optional: Refresh Token Rotation (hier: behalten wir das alte, wenn noch gültig)
    # Oder wir erstellen ein neues und revoken das alte.
    # Simple strategy: Reuse refresh token until expiry.
    
    return {
        "access_token": access_token,
        "refresh_token": request.refresh_token, # Return same refresh token
        "token_type": "bearer",
        "expires_in": REFRESH_TOKEN_TTL_MS / 1000
    }

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    token_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    stmt = select(RefreshToken).where(RefreshToken.tokenHash == token_hash)
    result = await session.execute(stmt)
    db_token = result.scalar_one_or_none()

    if db_token:
        db_token.revokedAt = datetime.utcnow()
        session.add(db_token)
        await session.commit()
    
    return None
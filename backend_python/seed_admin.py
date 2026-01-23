import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models import User, UserRole
from app.dependencies import get_password_hash

# Load env vars
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set!")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async def seed_admin():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    admin_email = os.getenv("ADMIN_USER_EMAIL")
    admin_password = os.getenv("ADMIN_USER_PASSWORD")
    admin_name = os.getenv("ADMIN_USER_NAME", "Admin User")

    if not admin_email or not admin_password:
        raise ValueError("ADMIN_USER_EMAIL and ADMIN_USER_PASSWORD must be set in .env!")

    print(f"Creating admin user: {admin_email}")
    
    async with async_session() as session:
        statement = select(User).where(User.email == admin_email)
        result = await session.execute(statement)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("Admin user already exists. Updating...")
            existing_user.role = UserRole.ADMIN
            existing_user.passwordHash = get_password_hash(admin_password)
            existing_user.quotaLlmTokens = -1
            existing_user.quotaRecipeCalls = -1
            session.add(existing_user)
        else:
            print("Creating new admin user...")
            new_user = User(
                email=admin_email,
                fullName=admin_name,
                passwordHash=get_password_hash(admin_password),
                role=UserRole.ADMIN,
                quotaLlmTokens=-1,
                quotaRecipeCalls=-1
            )
            session.add(new_user)
        
        await session.commit()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(seed_admin())

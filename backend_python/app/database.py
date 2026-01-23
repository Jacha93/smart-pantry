import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# Lade Umgebungsvariablen
load_dotenv()

# Hole URL und passe sie für AsyncPG an (postgresql:// -> postgresql+asyncpg://)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
  DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if not DATABASE_URL:
  raise ValueError("DATABASE_URL ist nicht gesetzt! Bitte .env prüfen.")

# Sicherstellen dass DATABASE_URL nicht in Logs/Errors erscheint
def sanitize_database_error(error_msg: str) -> str:
    """Entfernt DATABASE_URL aus Error Messages"""
    if not error_msg or not DATABASE_URL:
        return error_msg
    # Ersetze DATABASE_URL durch [REDACTED]
    return error_msg.replace(DATABASE_URL, "[DATABASE_URL_REDACTED]")

# Engine erstellen
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async def init_db():
  """Erstellt alle Tabellen in der Datenbank"""
  async with engine.begin() as conn:
    # Hier können wir Tabellen erstellen, wenn wir es nicht manuell gemacht haben
    # await conn.run_sync(SQLModel.metadata.create_all)
    pass

async def get_session() -> AsyncSession:
  async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
  )
  async with async_session() as session:
    yield session
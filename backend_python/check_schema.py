import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

EXPECTED_TABLES = [
    "CookedRecipe",
    "Grocery",
    "RefreshToken",
    "SavedRecipe",
    "ShoppingList",
    "ShoppingListItem",
    "User",
]


def get_database_url() -> str:
    env_path = Path(__file__).with_name(".env")
    load_dotenv(env_path)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in backend_python/.env")

    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    raise RuntimeError("DATABASE_URL must start with postgresql:// or postgres://")


async def main() -> None:
    engine = create_async_engine(get_database_url(), echo=False, future=True)

    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    """
                    select table_name
                    from information_schema.tables
                    where table_schema = 'public'
                      and table_name = any(:table_names)
                    order by table_name
                    """
                ),
                {"table_names": EXPECTED_TABLES},
            )
            found = {row.table_name for row in result}
    finally:
        await engine.dispose()

    missing = [table for table in EXPECTED_TABLES if table not in found]

    if missing:
        print("Schema check failed.")
        print(f"Found Smart Pantry tables: {', '.join(sorted(found)) or 'none'}")
        print(f"Missing tables: {', '.join(missing)}")
        raise SystemExit(1)

    print("Schema check passed.")


if __name__ == "__main__":
    asyncio.run(main())

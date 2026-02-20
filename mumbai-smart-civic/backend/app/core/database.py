from typing import Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, GEOSPHERE

from app.core.config import settings


_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    global _client, _database
    _client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=6000)
    _database = _client[settings.mongodb_db_name]
    try:
        await _client.admin.command("ping")
    except Exception:
        _client.close()
        _client = None
        _database = None
        raise


async def close_mongo_connection() -> None:
    global _client, _database
    if _client is not None:
        _client.close()
    _client = None
    _database = None


def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not connected",
        )
    return _database


async def init_indexes() -> None:
    if _database is None:
        return
    db = _database

    await db["users"].create_index([("email", ASCENDING)], unique=True)
    await db["complaints"].create_index([("location", GEOSPHERE)])
    await db["complaints"].create_index([("created_at", ASCENDING)])
    await db["complaints"].create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])

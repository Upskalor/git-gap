"""SQLAlchemy async database setup."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.core.config import settings

# Create async engine
engine_kwargs = {
    "echo": settings.debug,
    "future": True,
}
if "sqlite" not in settings.database_url:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
else:
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(
    settings.database_url,
    **engine_kwargs
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for all models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    from app import models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()

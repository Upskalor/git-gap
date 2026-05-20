"""Auth API router - user registration and login."""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.schemas import UserCreate, UserResponse, UserUpdate, LoginRequest, TokenResponse, RefreshTokenRequest
from app.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.database import get_db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, session: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    stmt = select(User).where((User.email == user_data.email) | (User.username == user_data.username))
    result = await session.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )

    # Create new user
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        goals=user_data.goals,
        hashed_password=hash_password(user_data.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, session: AsyncSession = Depends(get_db)):
    """Login and get tokens."""
    # Find user
    stmt = select(User).where(User.email == credentials.email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    # Generate tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    payload = verify_token(request.refresh_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    access_token = create_access_token(data={"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": request.refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update current user profile info, including learning goals."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if profile_data.full_name is not None:
        user.full_name = profile_data.full_name
    if profile_data.email is not None:
        # Check if email is taken
        email_stmt = select(User).where((User.email == profile_data.email) & (User.id != user_id))
        email_result = await session.execute(email_stmt)
        if email_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered by another user",
            )
        user.email = profile_data.email
    if profile_data.goals is not None:
        user.goals = profile_data.goals

    await session.commit()
    await session.refresh(user)
    return user

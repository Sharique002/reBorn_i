"""
Seed test users into the database for testing purposes.

This script creates predefined test accounts that can be used for 
development and testing without requiring manual registration.

Usage:
    python seed_test_users.py
"""

import asyncio
import os
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from dotenv import load_dotenv

from app.models.database import Base, User
from app.api.auth import hash_password

# Load environment variables
load_dotenv()

# Test users configuration
TEST_USERS = [
    {
        "email": "test01@example.com",
        "password": "Password@123",
        "full_name": "Test User 01",
        "subscription_plan": "free",
    },
    {
        "email": "test02@example.com",
        "password": "PayTest@456",
        "full_name": "Payment Tester",
        "subscription_plan": "free",
    },
    {
        "email": "test03@example.com",
        "password": "Premium@789",
        "full_name": "Premium User",
        "subscription_plan": "pro",  # Pre-upgraded to pro
    },
    {
        "email": "test04@gmail.com",
        "password": "Google@101112",
        "full_name": "Google Tester",
        "subscription_plan": "free",
    },
    {
        "email": "qa@test.com",
        "password": "QATest@2025",
        "full_name": "QA Tester",
        "subscription_plan": "free",
    },
]


async def seed_database():
    """Create test users in the database."""
    # Get database URL from environment
    database_url = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./reborn_dev.db"
    )
    
    # Create async engine
    engine = create_async_engine(
        database_url,
        echo=False,
        future=True,
    )
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        for user_data in TEST_USERS:
            try:
                # Check if user already exists
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"✓ User {user_data['email']} already exists (skipping)")
                    continue
                
                # Create new user
                new_user = User(
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    full_name=user_data["full_name"],
                    auth_provider="local",
                    is_active=True,
                    subscription_plan=user_data.get("subscription_plan", "free"),
                    subscription_started_at=(
                        datetime.now(timezone.utc)
                        if user_data.get("subscription_plan") == "pro"
                        else None
                    ),
                )
                
                session.add(new_user)
                await session.flush()
                print(
                    f"✓ Created user: {user_data['email']} ({user_data['full_name']})"
                )
                
            except Exception as e:
                print(f"✗ Error creating user {user_data['email']}: {str(e)}")
        
        # Commit all changes
        await session.commit()
    
    # Close engine
    await engine.dispose()
    
    print("\n" + "="*60)
    print("✅ Database seeding complete!")
    print("="*60)
    print("\n📧 Test Accounts Created:")
    print("-" * 60)
    for user in TEST_USERS:
        status = "✓ PRO" if user.get("subscription_plan") == "pro" else "✓ FREE"
        print(f"  {status} | {user['email']}")
        print(f"         Password: {user['password']}")
    print("-" * 60)


if __name__ == "__main__":
    print("\n🌱 Seeding reBorn_i Database with Test Users...\n")
    asyncio.run(seed_database())

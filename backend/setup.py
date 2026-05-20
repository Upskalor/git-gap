"""Setup and initialization script."""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command: list, description: str):
    """Run a shell command and handle errors."""
    print(f"\n{'='*60}")
    print(f"▶️  {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(command, check=True)
        print(f"✅ {description} - Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed!")
        print(f"Error: {e}")
        return False


def main():
    """Run setup tasks."""
    print("""
    ╔══════════════════════════════════════╗
    ║  🚀 DualLoop Backend Setup Script    ║
    ╚══════════════════════════════════════╝
    """)

    base_dir = Path(__file__).parent

    # Check Python version
    if sys.version_info < (3, 11):
        print("❌ Python 3.11+ is required!")
        sys.exit(1)

    print(f"✅ Python {sys.version.split()[0]} detected")

    # Create .env if doesn't exist
    env_file = base_dir / ".env"
    env_example = base_dir / ".env.example"
    
    if not env_file.exists() and env_example.exists():
        print("\n📋 Creating .env from .env.example...")
        with open(env_example) as src, open(env_file, "w") as dst:
            dst.write(src.read())
        print("✅ .env created - Please update with your configuration")

    # Install dependencies
    if not run_command(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        "Installing Python dependencies",
    ):
        sys.exit(1)

    # Optional: Create database
    print("\n📝 Setup Summary:")
    print("   ✅ Python dependencies installed")
    print("   ✅ .env configuration created")
    print("\n📚 Next steps:")
    print("   1. Update .env with your configuration")
    print("   2. Start PostgreSQL and Redis (use docker-compose up -d)")
    print("   3. Run migrations: alembic upgrade head")
    print("   4. Start dev server: uvicorn app.main:app --reload")
    print("   5. Start Celery: celery -A app.workers.tasks.celery_app worker --loglevel=info")
    print("\n🔗 Access:")
    print("   API: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")
    print("   Database: localhost:5432")
    print("   Redis: localhost:6379")


if __name__ == "__main__":
    main()

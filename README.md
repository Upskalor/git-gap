"""Project root README."""
# DualLoop - AI-Powered Code Analysis & Mentorship

A comprehensive platform for analyzing GitHub repositories and providing intelligent code mentorship through AI.

## Features

- 🔐 GitHub OAuth Integration
- 🔍 Deterministic Code Analysis
- 🤖 AI-Powered Mentorship with Claude
- 📊 Dashboard & Analytics
- ⚡ Async Processing with Celery
- 🐳 Docker Support

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Cache**: Redis
- **Task Queue**: Celery
- **AI**: Anthropic Claude API
- **Auth**: JWT + GitHub OAuth

## Project Structure

```
backend/
├── app/
│   ├── core/                 # Core configuration and utilities
│   │   ├── config.py        # Pydantic settings
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── security.py      # JWT and password hashing
│   │   └── deps.py          # Dependency injection
│   ├── routers/             # API endpoint routers
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── github.py        # GitHub integration
│   │   ├── analysis.py      # Analysis endpoints
│   │   └── dashboard.py     # Dashboard endpoints
│   ├── services/            # Business logic
│   │   ├── github_service.py    # GitHub API integration
│   │   ├── deterministic.py     # Code analysis engine
│   │   └── mentor_service.py    # AI mentorship engine
│   ├── workers/             # Async tasks
│   │   └── tasks.py         # Celery tasks
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   └── main.py              # FastAPI app entry point
├── Dockerfile               # Backend container
├── docker-compose.yml       # Full stack compose
├── requirements.txt         # Python dependencies
└── .env.example            # Environment template
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- PostgreSQL 16
- Redis 7

### Local Development

1. **Clone and setup**
```bash
cd backend
cp .env.example .env
# Update .env with your settings
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run database migrations**
```bash
alembic upgrade head
```

4. **Start development server**
```bash
uvicorn app.main:app --reload
```

5. **Start Celery worker** (in another terminal)
```bash
celery -A app.workers.tasks.celery_app worker --loglevel=info
```

### Docker Deployment

```bash
docker-compose up -d
```

Access the services:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Flower (Celery Monitoring): http://localhost:5555

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### GitHub Integration
- `GET /api/github/auth/url` - Get OAuth authorization URL
- `POST /api/github/auth/callback` - Handle OAuth callback
- `GET /api/github/repositories` - Get user's repositories

### Analysis
- `POST /api/analysis/` - Create new analysis
- `GET /api/analysis/{id}` - Get analysis results
- `POST /api/analysis/{id}/mentorship` - Get AI mentorship

### Dashboard
- `GET /api/dashboard/` - Get dashboard data
- `GET /api/dashboard/recent-activity` - Get recent activity

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dualloop

# Redis
REDIS_URL=redis://localhost:6379/0

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# GitHub App (for bot functionality)
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=base64_encoded_private_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_api_key

# Security
SECRET_KEY=your_secret_key_change_in_production
```

## Development

### Run tests
```bash
pytest
```

### Format code
```bash
black app/
```

### Lint
```bash
pylint app/
```

## Production Deployment

See `docker-compose.yml` for production-ready configuration. Key considerations:

1. Use environment variables for secrets
2. Enable Sentry for error tracking
3. Configure proper CORS origins
4. Use managed PostgreSQL and Redis services
5. Set up proper logging and monitoring

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

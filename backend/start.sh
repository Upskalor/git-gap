#!/bin/bash
# Quick start script for DualLoop backend

echo "╔══════════════════════════════════════╗"
echo "║  🚀 DualLoop Backend Quick Start     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found, using 'docker compose'"
    DC="docker compose"
else
    DC="docker-compose"
fi

# Start services
echo "🚀 Starting services..."
$DC up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check health
echo ""
echo "🏥 Service Health:"
echo "   PostgreSQL: $(curl -s http://localhost:5432 > /dev/null && echo '✅' || echo '⏳')"
echo "   Redis: $(curl -s http://localhost:6379 > /dev/null && echo '✅' || echo '⏳')"
echo "   Backend: $(curl -s http://localhost:8000/health | grep -q 'healthy' && echo '✅' || echo '⏳')"

echo ""
echo "✅ Services started!"
echo ""
echo "🔗 Access URLs:"
echo "   API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Flower (Celery): http://localhost:5555"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "📝 Useful commands:"
echo "   View logs: $DC logs -f backend"
echo "   Stop services: $DC down"
echo "   Rebuild: $DC build --no-cache"

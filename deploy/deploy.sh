#!/bin/bash
# ============================================================
# NextIntern.ai — Deploy / Update Script
# Usage: cd /opt/nextintern && bash deploy/deploy.sh
# ============================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env"

echo "🚀 NextIntern.ai — Deploying..."
echo "================================"

# ── Validate env file exists ────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Missing $ENV_FILE — copy from .env.production and fill in values"
    echo "   cp .env.production .env && nano .env"
    exit 1
fi

# ── Pull latest code (if git repo) ─────────────────────────
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
fi

# ── Build and start services ───────────────────────────────
echo "🔨 Building containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo "🟢 Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# ── Wait for services to be healthy ─────────────────────────
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Service status:"
docker compose -f "$COMPOSE_FILE" ps

# ── Quick health check ──────────────────────────────────────
echo ""
echo "🔍 Health checks:"

if curl -sf http://localhost/nginx-health > /dev/null 2>&1; then
    echo "  ✅ Nginx: OK"
else
    echo "  ❌ Nginx: DOWN"
fi

if curl -sf http://localhost/api/v1/actuator/health > /dev/null 2>&1; then
    echo "  ✅ API: OK"
else
    echo "  ⚠️  API: Starting (may take 30s)..."
fi

if curl -sf http://localhost/ > /dev/null 2>&1; then
    echo "  ✅ Web: OK"
else
    echo "  ⚠️  Web: Starting..."
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be available at: http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-ec2-ip>')"
echo ""
echo "📋 Useful commands:"
echo "  Logs:     docker compose -f $COMPOSE_FILE logs -f"
echo "  Status:   docker compose -f $COMPOSE_FILE ps"
echo "  Restart:  docker compose -f $COMPOSE_FILE restart"
echo "  Stop:     docker compose -f $COMPOSE_FILE down"
echo "  Rebuild:  bash deploy/deploy.sh"

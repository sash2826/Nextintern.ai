#!/usr/bin/env bash
# ============================================================
# NextIntern.ai — Staging Deploy Script
# Validates env, pulls images, and starts the staging stack.
# Usage: ./deploy.sh
# ============================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

echo "============================================"
echo "  NextIntern.ai — Staging Deployment"
echo "============================================"
echo ""

# ── Step 1: Validate environment file ────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE not found."
    echo ""
    echo "Create it from the template:"
    echo "  cp .env.staging.example .env.staging"
    echo "  # Then fill in real values"
    echo ""
    exit 1
fi

echo "✅ Found $ENV_FILE"

# ── Step 2: Export env vars for compose ──────────────────────
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

echo "✅ Environment loaded"

# ── Step 3: Build images ────────────────────────────────────
echo ""
echo "🔨 Building images..."
docker compose -f "$COMPOSE_FILE" build --parallel

# ── Step 4: Start the stack ─────────────────────────────────
echo ""
echo "🚀 Starting staging stack..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# ── Step 5: Show status ────────────────────────────────────
echo ""
echo "📦 Running containers:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "============================================"
echo "  ✅ Staging deployment complete!"
echo "  🌐 Access at: http://localhost"
echo "  📊 API health: http://localhost/api/actuator/health"
echo "============================================"

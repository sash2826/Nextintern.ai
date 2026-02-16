# ── Next.js Web Frontend ─────────────────────────
FROM node:20-alpine AS base

# Install deps
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk add --no-cache curl

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

USER appuser
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]

# Multi-stage Dockerfile for SU Card Next.js 16 standalone output

# Stage 1: Base image with corepack & pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    corepack prepare pnpm@12.4.2 --activate

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy placeholders to satisfy build-time module evaluation without baking secrets into image
ENV DATABASE_URL="postgres://build_placeholder:build_placeholder@127.0.0.1:5432/build_placeholder"
ENV BETTER_AUTH_SECRET="build_placeholder_secret_must_be_at_least_32_characters"
ENV BETTER_AUTH_URL="http://localhost:3000"

RUN pnpm build

# Stage 4: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Static files and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Database migrations and production scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/scripts/seed.mjs ./scripts/seed.mjs
COPY --from=builder /app/scripts/seed-qr-styles.mjs ./scripts/seed-qr-styles.mjs

USER nextjs

EXPOSE 3000

# Health check (hitting /login since /api/health is not defined)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/login || exit 1

CMD ["node", "server.js"]

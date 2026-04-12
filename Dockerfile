# ─────────────────────────────────────────
# Build API
# ─────────────────────────────────────────
FROM node:22-alpine AS api-build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /build
COPY api/package.json api/pnpm-lock.yaml api/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY api/ .
RUN pnpm build

# ─────────────────────────────────────────
# Build Client
# ─────────────────────────────────────────
FROM node:22-alpine AS client-build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /build
COPY client/package.json client/pnpm-lock.yaml client/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ .
RUN pnpm build

# ─────────────────────────────────────────
# Production
# ─────────────────────────────────────────
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate

# API
WORKDIR /app/api
COPY api/package.json api/pnpm-lock.yaml api/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=api-build /build/dist ./dist
COPY api/drizzle ./drizzle
COPY api/.env.schema ./.env.schema

# Client
WORKDIR /app/client
COPY client/package.json client/pnpm-lock.yaml client/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=client-build /build/build ./build

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]

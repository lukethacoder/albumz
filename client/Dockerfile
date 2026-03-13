# Multi-stage build for production
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start Vite dev server with host flag to allow external connections
# The dev server will run 'svelte-kit sync' automatically on startup
CMD ["pnpm", "dev", "--", "--host"]

# Build stage
FROM base AS build
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install only production dependencies (for SvelteKit adapter)
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=build /app/build ./build

# Expose port
EXPOSE 3000

# Start the application using SvelteKit's built output
CMD ["node", "build"]

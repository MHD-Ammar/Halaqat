FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder
FROM base AS builder
WORKDIR /app
COPY . .
# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@halaqat/api

# Runner
FROM base AS runner
WORKDIR /app

# Install netcat for database health check
RUN apk add --no-cache netcat-openbsd

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

# Copy and setup entrypoint script
COPY apps/api/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Environment
ENV NODE_ENV=production
EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main"]
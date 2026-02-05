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

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

# Environment
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/main"]
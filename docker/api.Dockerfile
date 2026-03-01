# PlaySight AI — API (Ingest)
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY services/ingest/package.json ./services/ingest/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=@playsight/ingest --workspace=@playsight/shared --include=workspace-root 2>/dev/null || npm install --workspace=@playsight/ingest --workspace=@playsight/shared --include=workspace-root

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @playsight/shared 2>/dev/null || true
RUN npm run build -w @playsight/ingest

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# Copy only what’s needed for a production install and run
COPY docker/root.package.json ./package.json
COPY services/ingest/package.json ./services/ingest/
COPY packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
RUN npm install --omit=dev --workspace=@playsight/ingest --workspace=@playsight/shared --include=workspace-root
COPY --from=builder /app/services/ingest/dist ./dist
COPY services/ingest/src/db/migrations ./dist/db/migrations
USER node
CMD ["node", "dist/index.js"]

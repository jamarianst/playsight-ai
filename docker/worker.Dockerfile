# PlaySight AI — Vision Worker
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY services/vision/package.json ./services/vision/
RUN npm ci --workspace=@playsight/vision --include=workspace-root 2>/dev/null || npm install --workspace=@playsight/vision --include=workspace-root

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @playsight/vision

FROM base AS runner
ENV NODE_ENV=production
# Minimal root package.json so only vision workspace exists; npm hoists deps to /app/node_modules
COPY docker/root.worker.package.json ./package.json
COPY services/vision/package.json ./services/vision/
RUN npm install --omit=dev --workspace=@playsight/vision --include=workspace-root
COPY --from=builder /app/services/vision/dist ./dist
USER node
CMD ["node", "dist/index.js"]

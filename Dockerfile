# Multi-stage build for lightweight, production-grade deployment
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install FFmpeg and ADB for Android bridge functionality
RUN apk add --no-cache ffmpeg android-tools bash

ENV NODE_ENV=production
ENV EDGE_MCP_OUTPUT_DIR=/app/output
ENV EDGE_MCP_WORK_DIR=/app/.edge_work

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY scripts/ ./scripts/
COPY README.md LICENSE ./

RUN mkdir -p /app/output /app/.edge_work && chmod -R 777 /app

ENTRYPOINT ["node", "dist/index.js"]

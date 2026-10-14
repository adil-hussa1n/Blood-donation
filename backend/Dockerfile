# ==========================================
# STAGE 1: Build TypeScript Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock
COPY package*.json ./
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist
RUN npm run build

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["node", "dist/server.js"]

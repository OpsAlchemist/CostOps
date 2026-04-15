# Use official Node.js runtime as base image (matching your local Node 20)
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# --------------------------
# Install Dependencies
# --------------------------

# Copy package files first for optimal layer caching
COPY package*.json ./

# Install exact dependencies from lockfile
RUN npm ci

# --------------------------
# Build Application
# --------------------------

# Copy all source files
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Compile TypeScript and build Next.js app
RUN npm run build

# Ensure public directory exists (create empty one if missing)
RUN mkdir -p /app/public

# --------------------------
# Production Image
# --------------------------

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files for runtime
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --omit=dev

# Copy the entire .next folder (standalone build + static files)
COPY --from=builder /app/.next ./.next

# Copy public folder (now guaranteed to exist from builder stage)
COPY --from=builder /app/public ./public

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port and start the production server
EXPOSE 3000

CMD ["npm", "start"]

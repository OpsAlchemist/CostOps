# Use official Node.js runtime as base image
FROM node:18 AS builder

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

# Copy TypeScript config before source code
COPY tsconfig.json .

# Copy all source files
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Compile TypeScript and build Next.js app
RUN npm run build

# --------------------------
# Production Image
# --------------------------

FROM node:18-alpine AS runner

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/.next ./

# Only copy necessary runtime files
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --omit=dev

# Expose port for Next.js
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
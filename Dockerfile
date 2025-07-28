# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# The application expects OPENWEATHER_API_KEY environment variable
ENV OPENWEATHER_API_KEY=""

# Run as non-root user
USER node

# The MCP server uses stdio for communication
# Use TCP wrapper for Kubernetes deployment
ENTRYPOINT ["node", "./build/tcp-wrapper.js"]

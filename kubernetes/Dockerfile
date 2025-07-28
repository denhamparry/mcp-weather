FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built JavaScript files
COPY build/ ./build/

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# MCP servers typically use stdio for communication
ENTRYPOINT ["node", "build/index.js"]

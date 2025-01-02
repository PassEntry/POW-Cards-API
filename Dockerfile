# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and TypeScript config
COPY . .
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache curl build-base gmp-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built JavaScript files from builder
COPY --from=builder /app/dist ./dist

# Expose port (change as needed)
EXPOSE 80

# Start the application using Node.js (not ts-node)
CMD ["node", "dist/server.js"]
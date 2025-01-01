# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and TypeScript config
COPY . .
COPY tsconfig.json ./

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install ts-node and typescript globally
RUN npm install -g ts-node typescript

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy TypeScript config and source code from builder
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src

# Expose port (change as needed)
EXPOSE 3000

# Start the application with ts-node
CMD ["npx", "ts-node", "src/server.ts"]
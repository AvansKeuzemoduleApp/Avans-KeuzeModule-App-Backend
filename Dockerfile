# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create sysadmin user
RUN addgroup sysadmin && adduser -D -u 1001 -G sysadmin sysadmin && \
    chown -R sysadmin:sysadmin /app

# Expose the port the app runs on   
EXPOSE 3000

# Run as sysadmin user
USER sysadmin

# Start the application
CMD ["npm", "run", "start:prod"]


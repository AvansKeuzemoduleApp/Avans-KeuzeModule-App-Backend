# Build stage
FROM node:20-alpine AS builder

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
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create sysadmin user (UID 1000 matches VPS)
RUN addgroup -g 1000 sysadmin && adduser -D -u 1000 -G sysadmin sysadmin && \
    chown -R sysadmin:sysadmin /app

# Expose the port the app runs on
EXPOSE 3000

# Run as sysadmin user
USER sysadmin

# Start the application
CMD ["npm", "run", "start:prod"]


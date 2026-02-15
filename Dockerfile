# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN bun install

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps ./apps
COPY packages ./packages

# Install production dependencies only
RUN bun install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["bun", "run", "start"]

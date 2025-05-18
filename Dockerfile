# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json files first for better layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies with layer caching - use ci for more reliable builds
RUN npm ci --ignore-scripts && \
    cd backend && npm ci --ignore-scripts && \
    cd ../frontend && npm ci --ignore-scripts

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build:quiet

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm ci --ignore-scripts --omit=dev && \
    cd backend && npm ci --ignore-scripts --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend source
COPY backend/src ./backend/src

# Copy other necessary files (excluding .env)
COPY *.js ./

# Verify the frontend build output exists
RUN ls -la frontend/dist

# Start the server
CMD ["npm", "start"]
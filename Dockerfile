FROM node:22-alpine

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend (use the quiet build script to avoid SASS warnings)
RUN cd frontend && npm run build:quiet

# Verify the build output exists
RUN ls -la frontend/dist

# Start the server
CMD ["npm", "start"]
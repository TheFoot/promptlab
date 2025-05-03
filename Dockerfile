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

# Build frontend (suppress SASS deprecation warnings by redirecting stderr)
RUN cd frontend && npm run build 2> /dev/null || npm run build

# Start the server
CMD ["npm", "start"]
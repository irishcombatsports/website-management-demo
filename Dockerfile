FROM node:20-alpine

WORKDIR /app

# Build tools needed for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Install frontend dependencies and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all source files
COPY . .

# Build the frontend
RUN cd frontend && npm run build

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "backend/src/server.js"]


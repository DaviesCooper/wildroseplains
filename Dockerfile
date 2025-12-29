FROM node:20-bookworm AS build

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Install frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy sources
COPY backend ./backend
COPY frontend ./frontend

# Build frontend (outputs to frontend/dist by default)
RUN cd frontend && npm run build

# Build backend (outputs to backend/dist)
RUN cd backend && npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install backend production deps
COPY --from=build /app/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy built backend and frontend assets
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./public

EXPOSE 8080

CMD ["node", "backend/dist/server.js"]


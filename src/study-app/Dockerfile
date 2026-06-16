# ── Stage 1: build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: production server ────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PROXY_PORT=3001

COPY package*.json ./
RUN npm install --omit=dev

COPY proxy.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "proxy.js"]

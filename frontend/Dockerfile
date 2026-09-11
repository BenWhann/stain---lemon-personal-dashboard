# Stage 1: Build static assets with Node 20
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve via high-performance Caddy server
FROM caddy:2-alpine AS runner

# Copy compiled static assets to Caddy's default webroot
COPY --from=builder /app/dist /usr/share/caddy

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

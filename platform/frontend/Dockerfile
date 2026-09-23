# syntax=docker/dockerfile:1

# 1. Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Enable legacy peer deps for npm install
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# Copy package descriptors
COPY package.json package-lock.json ./

# Install dependencies in the target Linux architecture
RUN npm install

# Copy source code and config
COPY . .

# Build-time Vite arguments
ARG VITE_API_URL
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ARG VITE_CLOUDINARY_CLOUD_NAME

ENV VITE_API_URL=$VITE_API_URL \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME

# Build production bundle
RUN npm run build

# 2. Production Stage (Caddy static web server)
FROM caddy:2-alpine AS runtime

COPY --from=build /app/dist /srv

# Configure Caddy for SPA routing, gzip, and caching
RUN echo $':80 {\n\
    root * /srv\n\
    encode gzip zstd\n\
    try_files {path} /index.html\n\
    file_server\n\
}' > /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

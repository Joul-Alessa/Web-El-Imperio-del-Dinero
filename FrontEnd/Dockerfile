# ---- Stage 1: Build Angular ----
FROM node:22.17.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:1.27.4-alpine3.21

COPY --from=build /app/dist/imperio-dinero-frontend/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# syntax=docker/dockerfile:1.7

# ---------- DEVELOPMENT ----------
FROM node:22.12.0-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll=1000"]

# ---------- BUILD ----------
FROM node:22.12.0-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run typecheck
RUN npm run build -- --configuration production

# ---------- PRODUCTION (nginx) ----------
FROM nginx:1.27.4-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/imperio/browser /usr/share/nginx/html
EXPOSE 80

# syntax=docker/dockerfile:1.7

# ---------- DEVELOPMENT ----------
FROM node:22.12.0-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && node --watch index.js"]

# ---------- TEST ----------
FROM dev AS test
COPY . .
RUN npm test

# ---------- BUILD (deps compiled for prod) ----------
FROM node:22.12.0-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && npm ci --build-from-source=sqlite3

# ---------- PRODUCTION ----------
FROM node:22.12.0-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && node index.js"]

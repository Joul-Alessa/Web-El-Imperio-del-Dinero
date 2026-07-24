# ---- Stage 1: Build Angular frontend ----
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend

COPY FrontEnd/package.json FrontEnd/package-lock.json ./
RUN npm ci

COPY FrontEnd/ ./
RUN npm run build -- --output-path=/app/dist-frontend

# ---- Stage 2: Build TypeScript backend ----
FROM node:22-bookworm-slim AS backend-build

WORKDIR /app/backend

COPY BackEnd/package.json BackEnd/package-lock.json ./
RUN npm ci

COPY BackEnd/tsconfig.json ./
COPY BackEnd/src/ ./src/
COPY BackEnd/migrations/ ./migrations/
COPY BackEnd/knexfile.ts ./
RUN npx tsc

# ---- Stage 3: Production image ----
FROM node:22-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=backend-build /app/backend/dist/ ./dist/
COPY --from=backend-build /app/backend/node_modules/ ./node_modules/
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/migrations/ ./migrations/
COPY --from=backend-build /app/backend/knexfile.ts ./knexfile.ts

COPY --from=frontend-build /app/dist-frontend/ ./public/

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/public

VOLUME /app/data

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]

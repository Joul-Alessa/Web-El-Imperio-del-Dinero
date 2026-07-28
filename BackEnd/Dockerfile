# ---- Stage 1: Build TypeScript ----
FROM node:22.17.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY knexfile.ts ./
RUN npm run build

# ---- Stage 2: Production runtime ----
FROM node:22.17.0-alpine3.22

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/migrations/ ./migrations/
COPY --from=build /app/knexfile.ts ./knexfile.ts

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/data.db

VOLUME /app/data

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/entrypoint.sh"]

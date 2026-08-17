#!/bin/sh
npx tsx watch /app/backend/src/server.ts &
cd /app/frontend && npx ng serve --host 0.0.0.0 --port 4200 --poll 1000 &
wait

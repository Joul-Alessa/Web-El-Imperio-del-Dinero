#!/bin/sh
set -e
./node_modules/.bin/tsx ./node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.ts
exec node dist/server.js

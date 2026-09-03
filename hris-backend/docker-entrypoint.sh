#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo "Seeding database (idempotent)..."
npx ts-node prisma/seed.ts || echo "Seed skipped/failed (non-fatal)"

echo "Starting HRIS backend..."
exec node dist/main.js

# HRIS

Implementation of the HRIS (Human Resource Information System) per [SRS-HRIS.md](./SRS-HRIS.md) and [SDD-HRIS.md](./SDD-HRIS.md), first release (Recruitment & Performance Review modules are not included yet — later phase).

## Structure

- [`hris-backend/`](./hris-backend) — REST API (NestJS + Prisma + PostgreSQL + Redis/BullMQ + MinIO)
- [`hris-frontend/`](./hris-frontend) — Web app (Next.js App Router + Ant Design)
- `docker-compose.yml` — orchestrates the whole stack for local development

## Running (Docker)

Prerequisite: Docker Desktop / Docker Engine + Compose plugin.

```bash
cp .env.example .env   # optional, edit if needed
docker compose build
docker compose up -d
```

The backend automatically runs `prisma db push` (schema sync) and seeds demo data on first container start.

Available services:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend REST API | http://localhost:4000/api/v1 |
| Swagger API docs | http://localhost:4000/api/docs |
| MinIO Console | http://localhost:9001 |

## Demo Accounts (from seed)

Same password for all accounts: **`Password123!`**

| Email | Role |
|---|---|
| employee@hris.local | Employee |
| manager@hris.local | Manager |
| hradmin@hris.local | HR Admin |
| superadmin@hris.local | Superadmin |

## Development without Docker

Since `npm` may be broken on some development machines, the most consistent way to install dependencies & run each app is still through a Node container, e.g. for the backend:

```bash
docker run --rm -it -v "${PWD}/hris-backend:/app" -w /app node:20-alpine sh
# inside the container:
npm install
npx prisma generate
npm run start:dev
```

The same pattern applies to `hris-frontend/` (`npm install && npm run dev`), as long as Postgres/Redis/MinIO are already running (e.g. via `docker compose up -d postgres redis minio`) and each app's `.env`/`.env.local` points to `localhost` instead of the Docker service names.

## Running natively on Windows (no Docker at all)

This is how the current local dev environment on this machine is set up (no Docker Desktop installed):

| Service | How it runs | Notes |
|---|---|---|
| PostgreSQL 16 | Installed via `winget install PostgreSQL.PostgreSQL.16` | Registered as Windows service `postgresql-x64-16`, starts automatically with Windows. Superuser `postgres` / `postgres`. App role/db: `hris` / `hris` / database `hris`. |
| Redis (portable) | Portable build in `.local-services/redis/` (gitignored) | Not a Windows service — must be started manually each session. |
| MinIO (portable) | Portable `minio.exe` in `.local-services/` (gitignored) | Not a Windows service — must be started manually each session. |

If PostgreSQL is not running after a reboot, start it with `Start-Service postgresql-x64-16` (or check `Get-Service postgresql-x64-16`).

To (re)provision the `hris` role/database (only needed once, already done):

```powershell
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE hris LOGIN PASSWORD 'hris';"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE hris OWNER hris;"
```

To download the portable Redis/MinIO binaries again (e.g. on a fresh clone), from the repo root:

```bash
mkdir -p .local-services && cd .local-services
curl -fsSL -o minio.exe "https://dl.min.io/server/minio/release/windows-amd64/minio.exe"
curl -fsSL -o redis.zip "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
mkdir -p redis && unzip -o redis.zip -d redis && rm redis.zip
mkdir -p minio-data
```

Each dev session, start Redis and MinIO in the background (from `.local-services/`):

```bash
./redis/redis-server.exe --port 6379 &
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin ./minio.exe server ./minio-data --console-address ":9001" &
```

Then, with `hris-backend/.env` pointing at `localhost` (see `.env.example`), run the backend and frontend as usual:

```bash
cd hris-backend && npm install && npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && npm run start:dev
cd hris-frontend && npm install && npm run dev
```

## Module Coverage (First Release)

Per SRS §3.1–3.6: Authentication & Access, Employee Management, Attendance & Working Hours, Leave, Payroll, Reporting & Analytics. The Recruitment (§3.7) and Performance Review (§3.8) modules are not implemented yet, as the SRS marks them as a later phase.

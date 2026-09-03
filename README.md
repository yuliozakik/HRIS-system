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

## Module Coverage (First Release)

Per SRS §3.1–3.6: Authentication & Access, Employee Management, Attendance & Working Hours, Leave, Payroll, Reporting & Analytics. The Recruitment (§3.7) and Performance Review (§3.8) modules are not implemented yet, as the SRS marks them as a later phase.

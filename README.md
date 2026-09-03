# HRIS Modern

Implementasi Sistem Informasi HRIS sesuai [SRS-HRIS.md](./SRS-HRIS.md) dan [SDD-HRIS.md](./SDD-HRIS.md), rilis pertama (modul Rekrutmen & Penilaian Kinerja belum termasuk — fase lanjutan).

## Struktur

- [`hris-backend/`](./hris-backend) — REST API (NestJS + Prisma + PostgreSQL + Redis/BullMQ + MinIO)
- [`hris-frontend/`](./hris-frontend) — Web app (Next.js App Router + Ant Design)
- `docker-compose.yml` — orkestrasi seluruh stack untuk pengembangan lokal

## Menjalankan (Docker)

Prasyarat: Docker Desktop / Docker Engine + Compose plugin.

```bash
cp .env.example .env   # opsional, edit jika perlu
docker compose build
docker compose up -d
```

Backend otomatis menjalankan `prisma db push` (sinkronisasi schema) dan seed data demo saat container pertama kali start.

Layanan yang tersedia:

| Layanan | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend REST API | http://localhost:4000/api/v1 |
| Swagger API docs | http://localhost:4000/api/docs |
| MinIO Console | http://localhost:9001 |

## Akun Demo (hasil seed)

Password sama untuk semua akun: **`Password123!`**

| Email | Role |
|---|---|
| employee@hris.local | Employee |
| manager@hris.local | Manager |
| hradmin@hris.local | HR Admin |
| superadmin@hris.local | Superadmin |

## Pengembangan tanpa Docker

Karena `npm` di beberapa mesin pengembangan mungkin bermasalah, cara paling konsisten untuk install dependency & menjalankan masing-masing app adalah tetap lewat container Node, contoh untuk backend:

```bash
docker run --rm -it -v "${PWD}/hris-backend:/app" -w /app node:20-alpine sh
# di dalam container:
npm install
npx prisma generate
npm run start:dev
```

Pola yang sama berlaku untuk `hris-frontend/` (`npm install && npm run dev`), asalkan Postgres/Redis/MinIO sudah berjalan (bisa lewat `docker compose up -d postgres redis minio`) dan file `.env`/`.env.local` masing-masing app mengarah ke `localhost` alih-alih nama service Docker.

## Cakupan Modul (Rilis Pertama)

Sesuai SRS §3.1–3.6: Autentikasi & Akses, Manajemen Karyawan, Absensi & Waktu Kerja, Cuti & Izin, Penggajian, Pelaporan & Analitik. Modul Rekrutmen (§3.7) dan Penilaian Kinerja (§3.8) belum diimplementasikan karena SRS menandainya sebagai fase lanjutan.

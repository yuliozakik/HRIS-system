"use client";

import Link from "next/link";
import { Button } from "antd";
import {
  ArrowRightOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  WalletOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: <TeamOutlined />,
    title: "Manajemen Karyawan",
    desc: "Data karyawan, struktur organisasi, riwayat mutasi, dan dokumen dalam satu tempat.",
  },
  {
    icon: <ClockCircleOutlined />,
    title: "Absensi & Waktu Kerja",
    desc: "Check-in/out sekali klik, kalkulasi telat & lembur otomatis, rekap tim real-time.",
  },
  {
    icon: <CalendarOutlined />,
    title: "Cuti & Izin",
    desc: "Ajukan cuti dari mana saja, saldo cuti terhitung otomatis, approval sekali sentuh.",
  },
  {
    icon: <WalletOutlined />,
    title: "Payroll Digital",
    desc: "Proses payroll batch, slip gaji PDF otomatis, riwayat penggajian per periode.",
  },
  {
    icon: <BarChartOutlined />,
    title: "Laporan & Analitik",
    desc: "Dashboard ringkasan SDM, export laporan ke Excel kapan pun dibutuhkan.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Akses Berbasis Peran",
    desc: "Kontrol akses granular untuk Karyawan, Manager, HR Admin, dan Superadmin.",
  },
];

const STATS = [
  { value: "6", label: "Modul inti" },
  { value: "4", label: "Peran akses" },
  { value: "100%", label: "Berbasis web" },
  { value: "24/7", label: "Bisa diakses" },
];

const ROLES = [
  { title: "Karyawan", desc: "Absen, ajukan cuti, dan unduh slip gaji sendiri tanpa ribet." },
  { title: "Manager", desc: "Setujui cuti tim & pantau rekap absensi dalam sekejap." },
  { title: "HR Admin", desc: "Kelola data karyawan, proses payroll, dan susun laporan SDM." },
];

export default function LandingPage() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Buka Dashboard" : "Masuk ke HRIS";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface-page">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-base text-white">
              🧭
            </span>
            HRIS
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
            <a href="#fitur" className="hover:text-text-primary">Fitur</a>
            <a href="#peran" className="hover:text-text-primary">Untuk Siapa</a>
          </nav>
          <Link href={primaryHref}>
            <Button type="primary" className="!h-10 !rounded-lg !font-medium">
              {primaryLabel}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-blue-subtle blur-3xl"
        />
        <div
          aria-hidden
          className="animate-float-slower pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-accent-subtle blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-in-up flex flex-col items-start gap-5 text-center lg:text-left [&>*]:mx-auto lg:[&>*]:mx-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-subtle px-3 py-1 text-xs font-semibold text-primary-container">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
              Sistem Informasi HRIS
            </span>
            <h1 className="font-heading text-3xl leading-tight font-bold text-text-primary sm:text-4xl lg:text-5xl">
              Kelola SDM perusahaan Anda,
              <br className="hidden sm:block" /> lebih cepat &amp; menyenangkan.
            </h1>
            <p className="max-w-md text-base text-text-secondary sm:text-lg">
              Satu platform untuk absensi, cuti, payroll, dan laporan SDM — dirancang agar
              tim HR dan karyawan sama-sama nyaman memakainya, di desktop maupun ponsel.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref}>
                <Button
                  type="primary"
                  size="large"
                  className="!h-12 !w-full !rounded-lg !px-6 !font-medium sm:!w-auto"
                >
                  {primaryLabel} <ArrowRightOutlined />
                </Button>
              </Link>
              <a href="#fitur" className="sm:contents">
                <Button size="large" className="!h-12 !w-full !rounded-lg !px-6 !font-medium sm:!w-auto">
                  Lihat Fitur
                </Button>
              </a>
            </div>
          </div>

          {/* Stylized product preview */}
          <div className="animate-fade-in-up relative mx-auto w-full max-w-sm [animation-delay:150ms] lg:max-w-none">
            <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-2.5 w-24 rounded-full bg-surface-subtle" />
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-danger/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-status-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-status-success/70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-blue-subtle p-3">
                  <ClockCircleOutlined className="text-primary-container" />
                  <div className="mt-2 font-heading text-xl font-bold text-text-primary">08:59</div>
                  <div className="text-xs text-text-secondary">Check-in hari ini</div>
                </div>
                <div className="rounded-xl bg-status-success-subtle p-3">
                  <CalendarOutlined className="text-status-success" />
                  <div className="mt-2 font-heading text-xl font-bold text-text-primary">12</div>
                  <div className="text-xs text-text-secondary">Sisa cuti tahunan</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-surface-subtle p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                  <span>Slip Gaji · Mei 2026</span>
                  <span className="font-semibold text-status-success">Tersedia</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border-subtle">
                  <div className="h-full w-4/5 rounded-full bg-primary-container" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent-subtle p-3">
                <WalletOutlined className="text-accent" />
                <div className="text-xs font-medium text-text-primary">
                  Payroll bulan ini sedang diproses…
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 hidden rounded-xl bg-white p-3 shadow-lg sm:flex sm:items-center sm:gap-2">
              <CheckCircleFilled className="text-status-success" />
              <span className="text-xs font-medium text-text-primary">Cuti disetujui</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border-subtle bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading text-2xl font-bold text-primary-container sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-text-secondary sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Semua kebutuhan SDM, dalam satu aplikasi
          </h2>
          <p className="mt-3 text-text-secondary">
            Dari absensi harian sampai payroll bulanan — HRIS menyatukan seluruh proses SDM
            perusahaan Anda.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-in-up rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
                {f.icon}
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold text-text-primary">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="peran" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
              Dirancang untuk setiap peran
            </h2>
            <p className="mt-3 text-text-secondary">
              Tampilan dan akses menyesuaikan siapa Anda — tanpa perlu training khusus.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-2xl bg-surface-subtle p-5">
                <h3 className="font-heading text-base font-semibold text-text-primary">
                  {r.title}
                </h3>
                <p className="mt-1.5 text-sm text-text-secondary">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-6 py-12 text-center text-white sm:px-12">
          <div
            aria-hidden
            className="animate-float-slow pointer-events-none absolute -top-10 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Siap kelola SDM lebih mudah?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-white/85">
            Masuk sekarang dan rasakan pengalaman mengelola absensi, cuti, dan payroll dalam satu tempat.
          </p>
          <Link href={primaryHref}>
            <Button
              size="large"
              className="!mt-6 !h-12 !rounded-lg !border-0 !bg-white !px-8 !font-semibold !text-primary-container hover:!bg-white/90"
            >
              {primaryLabel}
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-subtle py-8 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} HRIS. Sistem Informasi Manajemen SDM.
      </footer>
    </div>
  );
}

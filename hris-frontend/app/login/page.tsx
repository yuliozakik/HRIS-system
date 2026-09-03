"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Form, Input, Typography, Alert } from "antd";
import {
  MailOutlined,
  LockOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const FEATURES = [
  { icon: <TeamOutlined />, text: "Kelola data karyawan & struktur organisasi" },
  { icon: <ClockCircleOutlined />, text: "Absensi, keterlambatan & lembur otomatis" },
  { icon: <FileProtectOutlined />, text: "Cuti, payroll, dan slip gaji digital" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login gagal, coba lagi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-zinc-50 lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-6 py-8 text-white sm:px-10 lg:w-1/2 lg:px-16 lg:py-14">
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="animate-float-slower pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
        />

        <div className="animate-fade-in-up relative z-10 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur">
            🧭
          </span>
          <span className="text-2xl font-bold">HRIS</span>
        </div>

        <div className="animate-fade-in-up relative z-10 hidden [animation-delay:150ms] lg:block">
          <h1 className="text-3xl leading-tight font-semibold">
            Kelola SDM perusahaan Anda,
            <br /> lebih mudah & modern.
          </h1>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg">
                  {f.icon}
                </span>
                <span className="text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-in-up relative z-10 hidden text-xs text-white/60 [animation-delay:250ms] lg:block">
          © {new Date().getFullYear()} HRIS Modern
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:py-10">
        <Card className="animate-fade-in-up w-full max-w-sm !rounded-2xl !border-0 !shadow-xl [animation-delay:100ms]">
          <Typography.Title level={3} className="!mb-1">
            Selamat datang kembali
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Masuk untuk mengakses Sistem Informasi HRIS Anda
          </Typography.Paragraph>

          {error && <Alert type="error" message={error} showIcon className="!mb-4" />}

          <Form layout="vertical" onFinish={onFinish} disabled={submitting} size="large">
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Email wajib diisi" }, { type: "email" }]}
            >
              <Input
                prefix={<MailOutlined className="text-zinc-400" />}
                placeholder="nama@perusahaan.com"
                autoFocus
              />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password wajib diisi" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-zinc-400" />}
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item className="!mb-2">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!h-11 !rounded-lg !font-medium"
              >
                Masuk
              </Button>
            </Form.Item>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm">
                Lupa password?
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

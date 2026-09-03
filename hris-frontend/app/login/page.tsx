"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Form, Input, Typography, Alert } from "antd";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm shadow-md">
        <Typography.Title level={3} className="!mb-1">
          HRIS
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Masuk ke Sistem Informasi HRIS
        </Typography.Paragraph>

        {error && <Alert type="error" message={error} showIcon className="!mb-4" />}

        <Form layout="vertical" onFinish={onFinish} disabled={submitting}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Email wajib diisi" }, { type: "email" }]}
          >
            <Input placeholder="nama@perusahaan.com" autoFocus />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password wajib diisi" }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item className="!mb-2">
            <Button type="primary" htmlType="submit" block loading={submitting}>
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
  );
}

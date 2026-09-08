"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", values);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim permintaan reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-page px-4 py-8">
      <Card className="animate-fade-in-up w-full max-w-sm !rounded-2xl !border-0 !shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-subtle text-lg">
            🧭
          </span>
          <span className="font-heading text-lg font-bold text-text-primary">HRIS</span>
        </div>
        <Typography.Title level={3} className="!mb-1 font-heading">
          Lupa Password
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Masukkan email Anda, tautan reset password akan dikirim.
        </Typography.Paragraph>

        {error && <Alert type="error" message={error} showIcon className="!mb-4" />}
        {done ? (
          <Alert
            type="success"
            showIcon
            message="Jika email terdaftar, instruksi reset password telah dikirim."
          />
        ) : (
          <Form layout="vertical" onFinish={onFinish} disabled={submitting} size="large">
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Email wajib diisi" }, { type: "email" }]}
            >
              <Input
                prefix={<MailOutlined className="text-text-muted" />}
                placeholder="nama@perusahaan.com"
                autoFocus
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
                Kirim Tautan Reset
              </Button>
            </Form.Item>
          </Form>
        )}
        <div className="mt-2 text-center">
          <Link href="/login" className="text-sm">
            Kembali ke login
          </Link>
        </div>
      </Card>
    </div>
  );
}

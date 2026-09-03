"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm shadow-md">
        <Typography.Title level={3} className="!mb-1">
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
          <Form layout="vertical" onFinish={onFinish} disabled={submitting}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Email wajib diisi" }, { type: "email" }]}
            >
              <Input placeholder="nama@perusahaan.com" autoFocus />
            </Form.Item>
            <Form.Item className="!mb-2">
              <Button type="primary" htmlType="submit" block loading={submitting}>
                Kirim Tautan Reset
              </Button>
            </Form.Item>
          </Form>
        )}
        <div className="text-center mt-2">
          <Link href="/login" className="text-sm">
            Kembali ke login
          </Link>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { newPassword: string }) => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="animate-fade-in-up w-full max-w-sm !rounded-2xl !border-0 !shadow-xl">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-subtle text-lg">
          🧭
        </span>
        <span className="font-heading text-lg font-bold text-text-primary">HRIS</span>
      </div>
      <Typography.Title level={3} className="!mb-1 font-heading">
        Reset Password
      </Typography.Title>

      {!token && (
        <Alert
          type="warning"
          showIcon
          className="!mb-4"
          message="Tautan tidak valid. Gunakan tautan dari email reset password."
        />
      )}
      {error && <Alert type="error" message={error} showIcon className="!mb-4" />}

      <Form layout="vertical" onFinish={onFinish} disabled={submitting || !token} size="large">
        <Form.Item
          label="Password Baru"
          name="newPassword"
          rules={[
            { required: true, message: "Password wajib diisi" },
            { min: 6, message: "Minimal 6 karakter" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-text-muted" />}
            placeholder="Password baru"
          />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            className="!h-11 !rounded-lg !font-medium"
          >
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-page px-4 py-8">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
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
    <Card className="w-full max-w-sm shadow-md">
      <Typography.Title level={3} className="!mb-1">
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

      <Form layout="vertical" onFinish={onFinish} disabled={submitting || !token}>
        <Form.Item
          label="Password Baru"
          name="newPassword"
          rules={[
            { required: true, message: "Password wajib diisi" },
            { min: 6, message: "Minimal 6 karakter" },
          ]}
        >
          <Input.Password placeholder="Password baru" />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

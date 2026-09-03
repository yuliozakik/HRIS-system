"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Result, Select, DatePicker, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { apiDownload, ApiError, triggerBlobDownload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ExportType = "attendance" | "leave" | "payroll";

interface ExportFormValues {
  type: ExportType;
  period: Dayjs;
}

const TYPE_OPTIONS: { value: ExportType; label: string }[] = [
  { value: "attendance", label: "Absensi" },
  { value: "leave", label: "Cuti" },
  { value: "payroll", label: "Payroll" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm<ExportFormValues>();
  const [downloading, setDownloading] = useState(false);

  const isExportAllowed = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";
  const isViewAllowed = isExportAllowed || user?.role === "MANAGER";

  if (!isViewAllowed) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function handleExport(values: ExportFormValues) {
    setDownloading(true);
    try {
      const period = values.period.format("YYYY-MM");
      const blob = await apiDownload(
        `/reports/export?type=${values.type}&format=excel&period=${period}`,
      );
      triggerBlobDownload(blob, `report-${values.type}-${period}.xlsx`);
      message.success("Laporan berhasil diunduh");
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengunduh laporan");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Laporan</h1>
        <p className="text-zinc-500">Ekspor laporan absensi, cuti, dan payroll</p>
      </div>

      {isExportAllowed ? (
        <Card title="Ekspor Laporan">
          <Form form={form} layout="inline" onFinish={handleExport}>
            <Form.Item
              name="type"
              label="Jenis Laporan"
              rules={[{ required: true, message: "Jenis laporan wajib dipilih" }]}
            >
              <Select
                placeholder="Pilih jenis laporan"
                className="w-48"
                options={TYPE_OPTIONS}
              />
            </Form.Item>
            <Form.Item
              name="period"
              label="Periode"
              rules={[{ required: true, message: "Periode wajib dipilih" }]}
            >
              <DatePicker picker="month" format="MM-YYYY" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                htmlType="submit"
                loading={downloading}
              >
                Unduh Excel
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Ekspor laporan hanya tersedia untuk HR Admin"
        />
      )}
    </div>
  );
}

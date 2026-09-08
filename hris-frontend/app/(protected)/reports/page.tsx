"use client";

import { useState } from "react";
import { Alert, Button, Card, Form, Result, Select, DatePicker, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { apiDownload, ApiError, triggerBlobDownload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ExportType = "attendance" | "leave" | "payroll";
type ExportFormat = "excel" | "pdf";

interface ExportFormValues {
  type: ExportType;
  format: ExportFormat;
  period: Dayjs;
}

const TYPE_OPTIONS: { value: ExportType; label: string }[] = [
  { value: "attendance", label: "Absensi" },
  { value: "leave", label: "Cuti" },
  { value: "payroll", label: "Payroll" },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
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
        `/reports/export?type=${values.type}&format=${values.format}&period=${period}`,
      );
      const extension = values.format === "pdf" ? "pdf" : "xlsx";
      triggerBlobDownload(blob, `report-${values.type}-${period}.${extension}`);
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
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Laporan</h1>
        <p className="text-sm text-text-secondary">Ekspor laporan absensi, cuti, dan payroll</p>
      </div>

      {isExportAllowed ? (
        <Card title="Ekspor Laporan" className="animate-fade-in-up rounded-xl shadow-sm" bordered={false}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleExport}
            initialValues={{ format: "excel" as ExportFormat }}
            className="flex flex-col gap-x-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <Form.Item
              name="type"
              label="Jenis Laporan"
              rules={[{ required: true, message: "Jenis laporan wajib dipilih" }]}
              className="w-full sm:w-48"
            >
              <Select placeholder="Pilih jenis laporan" className="w-full" options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="period"
              label="Periode"
              rules={[{ required: true, message: "Periode wajib dipilih" }]}
              className="w-full sm:w-40"
            >
              <DatePicker picker="month" format="MM-YYYY" className="w-full" />
            </Form.Item>
            <Form.Item
              name="format"
              label="Format"
              rules={[{ required: true, message: "Format wajib dipilih" }]}
              className="w-full sm:w-32"
            >
              <Select className="w-full" options={FORMAT_OPTIONS} />
            </Form.Item>
            <Form.Item className="w-full sm:w-auto">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                htmlType="submit"
                loading={downloading}
                className="w-full sm:w-auto"
              >
                Unduh Laporan
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

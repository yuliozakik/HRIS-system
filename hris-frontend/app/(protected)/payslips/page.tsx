"use client";

import { useState } from "react";
import { Alert, Button, Card, Table, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { apiDownload, ApiError, triggerBlobDownload } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

interface Payslip {
  id: string;
  baseSalary: number | string;
  allowance: number | string;
  grossPay: number | string;
  deductions: number | string;
  netPay: number | string;
  payrollRun?: { period: string } | null;
  period?: string;
}

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
}

export default function PayslipsPage() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, loading, error } = useApiGet<Payslip[]>(
    user?.employeeId ? `/payslips/${user.employeeId}` : null,
  );

  async function handleDownload(row: Payslip) {
    if (!user?.employeeId) return;
    setDownloadingId(row.id);
    try {
      const blob = await apiDownload(`/payslips/${user.employeeId}/${row.id}/pdf`);
      const period = row.payrollRun?.period ?? row.period ?? row.id;
      triggerBlobDownload(blob, `slip-gaji-${period}.pdf`);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengunduh slip gaji");
    } finally {
      setDownloadingId(null);
    }
  }

  const columns: ColumnsType<Payslip> = [
    {
      title: "Periode",
      key: "period",
      render: (_, record) => record.payrollRun?.period ?? record.period ?? "-",
    },
    {
      title: "Gaji Bersih",
      dataIndex: "netPay",
      key: "netPay",
      render: (value: number | string) => formatCurrency(value),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          loading={downloadingId === record.id}
          onClick={() => handleDownload(record)}
        >
          Unduh PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Slip Gaji Saya</h1>
        <p className="text-zinc-500">Riwayat dan unduhan slip gaji Anda</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data ?? []}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

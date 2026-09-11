"use client";

import { useState } from "react";
import { Alert, App, Button, Table } from "antd";
import { DownloadOutlined, WalletOutlined } from "@ant-design/icons";
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
  const { message } = App.useApp();
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
      render: (value: number | string) => (
        <span className="font-semibold text-text-primary">{formatCurrency(value)}</span>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 140,
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Slip Gaji Saya</h1>
        <p className="text-sm text-text-secondary">Riwayat dan unduhan slip gaji Anda</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <div className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            columns={columns}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle text-lg text-accent">
                    <WalletOutlined />
                  </div>
                  <span className="text-sm text-text-muted">Belum ada slip gaji</span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

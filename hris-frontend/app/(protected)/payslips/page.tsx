"use client";

import { useState } from "react";
import { Alert, App, Button, Modal, Table } from "antd";
import { DownloadOutlined, EyeOutlined, WalletOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
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

function periodOf(row: Payslip) {
  return row.payrollRun?.period ?? row.period ?? row.id;
}

export default function PayslipsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<Payslip | null>(null);

  const { data, loading, error } = useApiGet<Payslip[]>(
    user?.employeeId ? `/payslips/${user.employeeId}` : null,
  );

  async function handleDownload(row: Payslip) {
    if (!user?.employeeId) return;
    setDownloadingId(row.id);
    try {
      const blob = await apiDownload(`/payslips/${user.employeeId}/${row.id}/pdf`);
      triggerBlobDownload(blob, `slip-gaji-${periodOf(row)}.pdf`);
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
      render: (_, record) => periodOf(record),
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
      width: 220,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewRow(record)}>
            Lihat
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={downloadingId === record.id}
            onClick={() => handleDownload(record)}
          >
            Unduh PDF
          </Button>
        </div>
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

      <Modal
        open={!!previewRow}
        onCancel={() => setPreviewRow(null)}
        title={null}
        footer={
          previewRow && [
            <Button key="close" onClick={() => setPreviewRow(null)}>
              Tutup
            </Button>,
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadingId === previewRow.id}
              onClick={() => handleDownload(previewRow)}
            >
              Unduh PDF
            </Button>,
          ]
        }
        width={480}
        destroyOnHidden
      >
        {previewRow && <PayslipPaper row={previewRow} employeeName={user?.fullName ?? "-"} />}
      </Modal>
    </div>
  );
}

function PayslipPaper({ row, employeeName }: { row: Payslip; employeeName: string }) {
  return (
    <div className="mt-2 rounded-lg border border-border-subtle bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-dashed border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-sm text-white">
            🧭
          </span>
          <span className="font-heading text-base font-bold text-text-primary">HRIS</span>
        </div>
        <span className="text-xs font-medium text-text-muted">Slip Gaji Elektronik</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">Nama Karyawan</p>
          <p className="font-heading text-base font-semibold text-text-primary">{employeeName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Periode</p>
          <p className="font-heading text-base font-semibold text-text-primary">{periodOf(row)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Gaji Pokok</span>
          <span className="font-medium text-text-primary">{formatCurrency(row.baseSalary)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Tunjangan</span>
          <span className="font-medium text-status-success">
            + {formatCurrency(row.allowance)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-secondary">Gaji Kotor</span>
          <span className="font-medium text-text-primary">{formatCurrency(row.grossPay)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Potongan</span>
          <span className="font-medium text-status-danger">
            - {formatCurrency(row.deductions)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-status-success-subtle px-4 py-3">
        <span className="text-sm font-semibold text-status-success">Gaji Bersih</span>
        <span className="font-heading text-lg font-bold text-status-success">
          {formatCurrency(row.netPay)}
        </span>
      </div>

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Dokumen ini dihasilkan otomatis oleh sistem pada {dayjs().format("DD MMMM YYYY")}
      </p>
    </div>
  );
}

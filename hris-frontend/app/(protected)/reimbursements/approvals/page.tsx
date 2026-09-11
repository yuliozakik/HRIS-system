"use client";

import { useState } from "react";
import { Alert, App, Button, Popconfirm, Result, Segmented, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, PaperClipOutlined, WalletOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api, ApiError, apiDownload, triggerBlobDownload } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  REIMBURSEMENT_CATEGORY_LABELS,
  REIMBURSEMENT_STATUS_LABELS,
  formatCurrency,
  type ReimbursementCategory,
  type ReimbursementRequest,
  type ReimbursementStatus,
} from "../types";

type StatusFilter = ReimbursementStatus | "ALL";

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Disetujui", value: "APPROVED" },
  { label: "Ditolak", value: "REJECTED" },
  { label: "Dibatalkan", value: "CANCELLED" },
  { label: "Semua", value: "ALL" },
];

export default function ReimbursementApprovalsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isEmployee = user?.role === "EMPLOYEE";
  const scope = user?.role === "MANAGER" ? "team" : "all"; // HR_ADMIN/SUPERADMIN -> all

  const query = new URLSearchParams();
  query.set("scope", scope);
  if (statusFilter !== "ALL") query.set("status", statusFilter);

  const { data, loading, error, reload } = useApiGet<ReimbursementRequest[]>(
    isEmployee ? null : `/reimbursements?${query.toString()}`,
    [statusFilter, scope],
  );

  if (isEmployee) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    setDecidingId(id);
    try {
      await api.patch(`/reimbursements/${id}`, { status });
      message.success(status === "APPROVED" ? "Reimbursement disetujui" : "Reimbursement ditolak");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal memproses pengajuan");
    } finally {
      setDecidingId(null);
    }
  }

  async function handleDownloadReceipt(row: ReimbursementRequest) {
    setDownloadingId(row.id);
    try {
      const blob = await apiDownload(`/reimbursements/${row.id}/receipt`);
      triggerBlobDownload(blob, row.receiptUrl?.split("/").pop() ?? "bukti-pengeluaran");
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengunduh bukti pengeluaran");
    } finally {
      setDownloadingId(null);
    }
  }

  const columns: ColumnsType<ReimbursementRequest> = [
    {
      title: "Karyawan",
      key: "employee",
      render: (_, record) => record.employee?.fullName ?? "-",
    },
    {
      title: "Kategori",
      dataIndex: "category",
      render: (category: ReimbursementCategory) => REIMBURSEMENT_CATEGORY_LABELS[category],
    },
    {
      title: "Jumlah",
      dataIndex: "amount",
      render: (amount: string | number) => (
        <span className="font-medium text-text-primary">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      responsive: ["sm"],
      render: (value: string) => dayjs(value).format("DD-MM-YYYY"),
    },
    {
      title: "Keterangan",
      dataIndex: "description",
      responsive: ["sm"],
      render: (description: string | null) =>
        description || <span className="text-text-muted">-</span>,
    },
    {
      title: "Bukti",
      key: "receipt",
      render: (_, record) =>
        record.receiptUrl ? (
          <Button
            size="small"
            icon={<PaperClipOutlined />}
            loading={downloadingId === record.id}
            onClick={() => handleDownloadReceipt(record)}
          >
            Lihat
          </Button>
        ) : (
          <span className="text-text-muted">-</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: ReimbursementStatus) => REIMBURSEMENT_STATUS_LABELS[status],
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record) =>
        record.status === "PENDING" ? (
          <div className="flex flex-wrap gap-2">
            <Popconfirm
              title="Setujui pengajuan ini?"
              onConfirm={() => handleDecision(record.id, "APPROVED")}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                loading={decidingId === record.id}
              >
                Setujui
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Tolak pengajuan ini?"
              onConfirm={() => handleDecision(record.id, "REJECTED")}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button size="small" danger icon={<CloseOutlined />} loading={decidingId === record.id}>
                Tolak
              </Button>
            </Popconfirm>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">
          Approval Reimbursement
        </h1>
        <p className="text-sm text-text-secondary">
          {scope === "team" ? "Pengajuan reimbursement tim Anda" : "Pengajuan reimbursement seluruh karyawan"}
        </p>
      </div>

      <div className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-base font-semibold text-text-primary">
            Daftar Pengajuan
          </h2>
          <div className="-mx-1 overflow-x-auto px-1">
            <Segmented
              size="small"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {error && <Alert type="error" showIcon message={error} className="mb-4" />}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            columns={columns}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
                    <WalletOutlined />
                  </div>
                  <span className="text-sm text-text-muted">Tidak ada pengajuan reimbursement</span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

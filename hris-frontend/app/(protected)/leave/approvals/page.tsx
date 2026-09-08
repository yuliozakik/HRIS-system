"use client";

import { useState } from "react";
import { Alert, Button, Popconfirm, Result, Segmented, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "../types";

type StatusFilter = LeaveStatus | "ALL";

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Disetujui", value: "APPROVED" },
  { label: "Ditolak", value: "REJECTED" },
  { label: "Dibatalkan", value: "CANCELLED" },
  { label: "Semua", value: "ALL" },
];

export default function LeaveApprovalsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const isEmployee = user?.role === "EMPLOYEE";
  const scope = user?.role === "MANAGER" ? "team" : "all"; // HR_ADMIN/SUPERADMIN -> all

  const query = new URLSearchParams();
  if (!isEmployee) query.set("scope", scope);
  if (statusFilter !== "ALL") query.set("status", statusFilter);

  const { data, loading, error, reload } = useApiGet<LeaveRequest[]>(
    isEmployee ? null : `/leave-requests?${query.toString()}`,
    [statusFilter, scope],
  );

  if (isEmployee) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    setDecidingId(id);
    try {
      await api.patch(`/leave-requests/${id}`, { status });
      message.success(status === "APPROVED" ? "Cuti disetujui" : "Cuti ditolak");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal memproses pengajuan");
    } finally {
      setDecidingId(null);
    }
  }

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: "Karyawan",
      key: "employee",
      render: (_, record: LeaveRequest) => record.employee?.fullName ?? "-",
    },
    {
      title: "Jenis Cuti",
      dataIndex: "leaveType",
      render: (type: LeaveType) => LEAVE_TYPE_LABELS[type],
    },
    { title: "Tanggal Mulai", dataIndex: "startDate" },
    { title: "Tanggal Selesai", dataIndex: "endDate" },
    {
      title: "Alasan",
      dataIndex: "reason",
      responsive: ["sm"],
      render: (reason: string | null) => reason || <span className="text-text-muted">-</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: LeaveStatus) => LEAVE_STATUS_LABELS[status],
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record: LeaveRequest) =>
        record.status === "PENDING" ? (
          <div className="flex flex-wrap gap-2">
            <Popconfirm
              title="Setujui pengajuan cuti ini?"
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
              title="Tolak pengajuan cuti ini?"
              onConfirm={() => handleDecision(record.id, "REJECTED")}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                loading={decidingId === record.id}
              >
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
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Approval Cuti</h1>
        <p className="text-sm text-text-secondary">
          {scope === "team" ? "Pengajuan cuti tim Anda" : "Pengajuan cuti seluruh karyawan"}
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
                    <FileTextOutlined />
                  </div>
                  <span className="text-sm text-text-muted">Tidak ada pengajuan cuti</span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

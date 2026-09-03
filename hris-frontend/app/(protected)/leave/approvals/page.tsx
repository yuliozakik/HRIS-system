"use client";

import { useState } from "react";
import { Alert, Button, Card, Popconfirm, Result, Segmented, Table, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Approval Cuti</h1>
        <p className="text-zinc-500">
          {scope === "team" ? "Pengajuan cuti tim Anda" : "Pengajuan cuti seluruh karyawan"}
        </p>
      </div>

      <Card
        title="Daftar Pengajuan"
        extra={
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        }
      >
        {error && <Alert type="error" showIcon message={error} className="mb-4" />}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
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
              render: (reason: string | null) => reason || <span className="text-zinc-400">-</span>,
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
                  <div className="flex gap-2">
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
          ]}
        />
      </Card>
    </div>
  );
}

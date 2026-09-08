"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { api, ApiError } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_OPTIONS,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveType,
} from "./types";

interface LeaveRequestFormValues {
  leaveType: LeaveType;
  dateRange: [Dayjs, Dayjs];
  reason?: string;
}

const BALANCE_TINTS: Record<LeaveType, string> = {
  ANNUAL: "bg-brand-blue-subtle text-primary-container",
  SICK: "bg-status-warning-subtle text-status-warning",
  UNPAID: "bg-surface-container text-tertiary",
  OTHER: "bg-status-success-subtle text-status-success",
};

export default function LeavePage() {
  const { user } = useAuth();
  const [form] = Form.useForm<LeaveRequestFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    data: balances,
    loading: balancesLoading,
    error: balancesError,
    reload: reloadBalances,
  } = useApiGet<LeaveBalance[]>(
    user?.employeeId ? `/leave-balances/${user.employeeId}` : null,
  );

  const {
    data: requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useApiGet<LeaveRequest[]>("/leave-requests");

  async function handleSubmit(values: LeaveRequestFormValues) {
    setSubmitting(true);
    try {
      const [start, end] = values.dateRange;
      await api.post("/leave-requests", {
        leaveType: values.leaveType,
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        reason: values.reason || undefined,
      });
      message.success("Pengajuan cuti berhasil dikirim");
      setModalOpen(false);
      form.resetFields();
      reloadBalances();
      reloadRequests();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengajukan cuti");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await api.patch(`/leave-requests/${id}/cancel`);
      message.success("Pengajuan cuti dibatalkan");
      reloadBalances();
      reloadRequests();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal membatalkan cuti");
    } finally {
      setCancellingId(null);
    }
  }

  const columns: ColumnsType<LeaveRequest> = [
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
      render: (status: LeaveRequest["status"]) => (
        <Tag color={LEAVE_STATUS_COLORS[status]}>{LEAVE_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record: LeaveRequest) =>
        record.status === "PENDING" ? (
          <Popconfirm
            title="Batalkan pengajuan cuti ini?"
            onConfirm={() => handleCancel(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button size="small" danger loading={cancellingId === record.id}>
              Batalkan
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Cuti Saya</h1>
          <p className="text-sm text-text-secondary">Ajukan dan pantau status cuti Anda</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          disabled={!user?.employeeId}
          size="large"
          block
          className="sm:!w-auto"
        >
          Ajukan Cuti
        </Button>
      </div>

      <div className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">Saldo Cuti</h2>
        {balancesError && <Alert type="error" showIcon message={balancesError} className="mb-3" />}
        {balancesLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : balances && balances.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {balances.map((b) => (
              <div key={b.id} className="rounded-xl bg-surface-subtle p-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${BALANCE_TINTS[b.leaveType]}`}
                >
                  <CalendarOutlined />
                </div>
                <p className="mt-2 text-xs font-medium text-text-secondary">
                  {LEAVE_TYPE_LABELS[b.leaveType]} ({b.year})
                </p>
                <p className="font-heading text-lg font-bold text-text-primary">
                  {b.balance} <span className="text-xs font-normal text-text-secondary">hari</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-text-muted">Belum ada data saldo cuti</span>
        )}
      </div>

      <div
        className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">
          Riwayat Pengajuan
        </h2>
        {requestsError && <Alert type="error" showIcon message={requestsError} className="mb-4" />}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={requestsLoading}
            dataSource={requests ?? []}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            columns={columns}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
                    <CalendarOutlined />
                  </div>
                  <span className="text-sm text-text-muted">Belum ada pengajuan cuti</span>
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Modal
        title="Ajukan Cuti"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Kirim"
        cancelText="Batal"
        confirmLoading={submitting}
        destroyOnHidden
        width="92vw"
        style={{ maxWidth: 480 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="leaveType"
            label="Jenis Cuti"
            rules={[{ required: true, message: "Jenis cuti wajib dipilih" }]}
          >
            <Select options={LEAVE_TYPE_OPTIONS} placeholder="Pilih jenis cuti" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Tanggal Cuti"
            rules={[{ required: true, message: "Tanggal cuti wajib diisi" }]}
          >
            <DatePicker.RangePicker
              className="w-full"
              disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Alasan">
            <Input.TextArea rows={3} placeholder="Alasan (opsional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

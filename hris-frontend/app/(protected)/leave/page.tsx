"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Statistic,
  Table,
  Tag,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cuti Saya</h1>
          <p className="text-zinc-500">Ajukan dan pantau status cuti Anda</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          disabled={!user?.employeeId}
        >
          Ajukan Cuti
        </Button>
      </div>

      <Card title="Saldo Cuti">
        {balancesError && <Alert type="error" showIcon message={balancesError} />}
        {balancesLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : balances && balances.length > 0 ? (
          <Row gutter={[16, 16]}>
            {balances.map((b) => (
              <Col xs={12} sm={8} md={6} key={b.id}>
                <Statistic
                  title={`${LEAVE_TYPE_LABELS[b.leaveType]} (${b.year})`}
                  value={b.balance}
                  suffix="hari"
                />
              </Col>
            ))}
          </Row>
        ) : (
          <span className="text-zinc-400">Belum ada data saldo cuti</span>
        )}
      </Card>

      <Card title="Riwayat Pengajuan">
        {requestsError && <Alert type="error" showIcon message={requestsError} className="mb-4" />}
        <Table
          rowKey="id"
          loading={requestsLoading}
          dataSource={requests ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
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
          ]}
        />
      </Card>

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

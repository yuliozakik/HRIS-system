"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Modal,
  Result,
  Table,
  Tag,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { api, ApiError } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

type PayrollStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";

interface PayrollRun {
  id: string;
  period: string;
  status: PayrollStatus;
  processedAt: string | null;
  createdAt: string;
}

interface CreateRunFormValues {
  period: Dayjs;
}

function statusColor(status: PayrollStatus) {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "PROCESSING":
      return "blue";
    case "FAILED":
      return "red";
    default:
      return "default";
  }
}

function statusLabel(status: PayrollStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PROCESSING":
      return "Diproses";
    case "COMPLETED":
      return "Selesai";
    case "FAILED":
      return "Gagal";
    default:
      return status;
  }
}

export default function PayrollPage() {
  const { user } = useAuth();
  const [form] = Form.useForm<CreateRunFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAllowed = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const { data, loading, error, reload } = useApiGet<PayrollRun[]>(
    isAllowed ? "/payroll-runs" : null,
  );

  if (!isAllowed) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function handleSubmit(values: CreateRunFormValues) {
    setSubmitting(true);
    try {
      await api.post("/payroll-runs", { period: values.period.format("YYYY-MM") });
      message.success("Payroll run berhasil dibuat dan sedang diproses");
      setModalOpen(false);
      form.resetFields();
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal membuat payroll run");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnsType<PayrollRun> = [
    { title: "Periode", dataIndex: "period", key: "period" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: PayrollStatus) => (
        <Tag color={statusColor(status)} icon={status === "PROCESSING" ? <SyncOutlined spin /> : undefined}>
          {statusLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Diproses Pada",
      dataIndex: "processedAt",
      key: "processedAt",
      render: (value: string | null) => (value ? dayjs(value).format("DD-MM-YYYY HH:mm") : "-"),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 140,
      render: (_, record) => <Link href={`/payroll/${record.id}`}>Lihat Detail</Link>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Payroll</h1>
          <p className="text-sm text-text-secondary">Kelola proses penggajian karyawan</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Proses Payroll
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card
        title="Riwayat Payroll Run"
        className="animate-fade-in-up rounded-xl shadow-sm"
        bordered={false}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => reload()}>
            Refresh
          </Button>
        }
      >
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            columns={columns}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue-subtle text-2xl text-primary-container">
                    <SyncOutlined />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Belum ada payroll run</p>
                    <p className="text-sm text-text-secondary">Klik &quot;Proses Payroll&quot; untuk memulai</p>
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </Card>

      <Modal
        title="Proses Payroll"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Proses"
        cancelText="Batal"
        confirmLoading={submitting}
        destroyOnHidden
        width="92vw"
        style={{ maxWidth: 480 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="period"
            label="Periode"
            rules={[{ required: true, message: "Periode wajib dipilih" }]}
          >
            <DatePicker picker="month" className="w-full" format="MM-YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

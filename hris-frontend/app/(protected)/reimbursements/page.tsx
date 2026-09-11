"use client";

import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import {
  AccountBookOutlined,
  InboxOutlined,
  PaperClipOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api, ApiError, apiDownload, triggerBlobDownload } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import {
  REIMBURSEMENT_CATEGORY_LABELS,
  REIMBURSEMENT_CATEGORY_OPTIONS,
  REIMBURSEMENT_STATUS_COLORS,
  REIMBURSEMENT_STATUS_LABELS,
  formatCurrency,
  type ReimbursementCategory,
  type ReimbursementRequest,
} from "./types";

interface ReimbursementFormValues {
  category: ReimbursementCategory;
  amount: number;
  description?: string;
}

export default function ReimbursementsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<ReimbursementFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data, loading, error, reload } = useApiGet<ReimbursementRequest[]>("/reimbursements");

  async function handleSubmit(values: ReimbursementFormValues) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", values.category);
      formData.append("amount", String(values.amount));
      if (values.description) formData.append("description", values.description);
      if (receiptFile) formData.append("receipt", receiptFile);

      await api.post("/reimbursements", formData);
      message.success("Pengajuan reimbursement berhasil dikirim");
      setModalOpen(false);
      form.resetFields();
      setReceiptFile(null);
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengajukan reimbursement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await api.patch(`/reimbursements/${id}/cancel`);
      message.success("Pengajuan dibatalkan");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal membatalkan pengajuan");
    } finally {
      setCancellingId(null);
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

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setReceiptFile(file);
      return false;
    },
    onRemove: () => setReceiptFile(null),
    fileList: receiptFile
      ? [{ uid: "receipt", name: receiptFile.name, status: "done" as const }]
      : [],
    maxCount: 1,
    accept: "image/*,.pdf",
  };

  const sorted = (data ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Reimbursement</h1>
          <p className="text-sm text-text-secondary">Ajukan dan pantau penggantian biaya Anda</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          disabled={!user?.employeeId}
          className="!hidden sm:!inline-flex"
        >
          Ajukan
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <div className="animate-fade-in-up flex flex-col gap-2">
        {loading ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <Skeleton active />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Empty description="Belum ada pengajuan reimbursement" />
          </div>
        ) : (
          sorted.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {REIMBURSEMENT_CATEGORY_LABELS[r.category]}
                    </span>
                    <Tag color={REIMBURSEMENT_STATUS_COLORS[r.status]}>
                      {REIMBURSEMENT_STATUS_LABELS[r.status]}
                    </Tag>
                  </div>
                  <p className="mt-1 font-heading text-lg font-bold text-text-primary">
                    {formatCurrency(r.amount)}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-xs text-text-muted">{r.description}</p>
                  )}
                  <p className="mt-1 text-xs text-text-muted">
                    Diajukan {dayjs(r.createdAt).format("D MMM YYYY")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {r.receiptUrl && (
                    <Button
                      size="small"
                      icon={<PaperClipOutlined />}
                      loading={downloadingId === r.id}
                      onClick={() => handleDownloadReceipt(r)}
                    >
                      Bukti
                    </Button>
                  )}
                  {r.status === "PENDING" && (
                    <Popconfirm
                      title="Batalkan pengajuan ini?"
                      onConfirm={() => handleCancel(r.id)}
                      okText="Ya"
                      cancelText="Tidak"
                    >
                      <Button size="small" danger loading={cancellingId === r.id}>
                        Batalkan
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        size="large"
        onClick={() => setModalOpen(true)}
        disabled={!user?.employeeId}
        className="!fixed !bottom-20 !right-4 !z-20 !h-12 !rounded-full !px-5 !shadow-lg sm:!hidden"
      >
        Ajukan
      </Button>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <AccountBookOutlined /> Ajukan Reimbursement
          </span>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setReceiptFile(null);
        }}
        onOk={() => form.submit()}
        okText="Kirim"
        cancelText="Batal"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="category"
            label="Kategori"
            rules={[{ required: true, message: "Kategori wajib dipilih" }]}
          >
            <Select options={REIMBURSEMENT_CATEGORY_OPTIONS} placeholder="Pilih kategori" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Jumlah (Rp)"
            rules={[{ required: true, message: "Jumlah wajib diisi" }]}
          >
            <InputNumber<number>
              className="w-full"
              min={0}
              step={10000}
              formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0)}
            />
          </Form.Item>
          <Form.Item name="description" label="Keterangan">
            <Input.TextArea rows={3} placeholder="Keterangan (opsional)" />
          </Form.Item>
          <Form.Item label="Bukti Pengeluaran (opsional)">
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Klik atau seret struk/kwitansi ke sini</p>
              <p className="ant-upload-hint text-xs">Gambar atau PDF, maks. 1 berkas</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

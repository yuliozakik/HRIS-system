"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Table,
  Tag,
  Timeline,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Mutation {
  id?: string;
  toPositionId?: string;
  toDepartmentId?: string;
  effectiveDate?: string;
  note?: string;
}

interface EmployeeDetail {
  id: string;
  nik: string;
  fullName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: "ACTIVE" | "INACTIVE" | "RESIGNED";
  hireDate: string;
  baseSalary: number;
  allowance?: number | null;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  manager: { id: string; fullName: string } | null;
  mutations?: Mutation[];
}

interface EmployeeDocument {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "INACTIVE":
      return "orange";
    case "RESIGNED":
      return "red";
    default:
      return "default";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "INACTIVE":
      return "Nonaktif";
    case "RESIGNED":
      return "Resign";
    default:
      return status;
  }
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const employeeId = params.id;

  const { data: employee, loading, error, reload } = useApiGet<EmployeeDetail>(
    employeeId ? `/employees/${employeeId}` : null,
  );
  const { data: documents, reload: reloadDocuments } = useApiGet<EmployeeDocument[]>(
    employeeId ? `/employees/${employeeId}/documents` : null,
  );

  const isPrivileged = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";
  const isSelf = !!user?.employeeId && user.employeeId === employeeId;
  const canEdit = isPrivileged || isSelf;
  const canUploadDocs = isPrivileged || isSelf;

  const [editOpen, setEditOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const onArchive = async () => {
    if (!employeeId) return;
    setArchiving(true);
    try {
      await api.patch(`/employees/${employeeId}/archive`);
      message.success("Karyawan berhasil diarsipkan");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengarsipkan karyawan");
    } finally {
      setArchiving(false);
    }
  };

  if (loading || !employee) {
    return (
      <div className="flex flex-col gap-4">
        {error && <Alert type="error" showIcon message={error} />}
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{employee.fullName}</h1>
          <p className="text-zinc-500">NIK {employee.nik}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && <Button onClick={() => setEditOpen(true)}>Edit</Button>}
          {isPrivileged && employee.status !== "RESIGNED" && (
            <Popconfirm
              title="Arsipkan karyawan ini?"
              description="Status karyawan akan diubah menjadi resign/nonaktif."
              onConfirm={onArchive}
              okText="Ya, arsipkan"
              cancelText="Batal"
            >
              <Button danger loading={archiving}>
                Arsipkan
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      <Card title="Informasi Karyawan">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Status">
            <Tag color={statusColor(employee.status)}>{statusLabel(employee.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal Masuk">
            {employee.hireDate ? dayjs(employee.hireDate).format("DD-MM-YYYY") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Departemen">
            {employee.department?.name ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Jabatan">{employee.position?.title ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Manager">{employee.manager?.fullName ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Email">{employee.email ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Telepon">{employee.phone ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Alamat" span={2}>
            {employee.address ?? "-"}
          </Descriptions.Item>
          {isPrivileged && (
            <>
              <Descriptions.Item label="Gaji Pokok">
                {formatCurrency(employee.baseSalary)}
              </Descriptions.Item>
              <Descriptions.Item label="Tunjangan">
                {formatCurrency(employee.allowance)}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {employee.mutations && employee.mutations.length > 0 && (
        <Card title="Riwayat Mutasi">
          <Timeline
            items={employee.mutations.map((m) => ({
              children: (
                <div>
                  <div className="font-medium">
                    {m.effectiveDate ? dayjs(m.effectiveDate).format("DD-MM-YYYY") : "-"}
                  </div>
                  {m.note && <div className="text-zinc-500">{m.note}</div>}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      <Card title="Dokumen">
        <Table
          rowKey="id"
          dataSource={documents ?? []}
          pagination={false}
          locale={{ emptyText: <Empty description="Belum ada dokumen" /> }}
          columns={[
            { title: "Jenis Dokumen", dataIndex: "docType" },
            { title: "Nama File", dataIndex: "fileName" },
            {
              title: "Tanggal Unggah",
              dataIndex: "uploadedAt",
              render: (value: string) => (value ? dayjs(value).format("DD-MM-YYYY HH:mm") : "-"),
            },
          ]}
        />
        {canUploadDocs && (
          <div className="mt-4">
            <DocumentUploadForm employeeId={employeeId} onUploaded={reloadDocuments} />
          </div>
        )}
      </Card>

      {employee && (
        <EditEmployeeModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          employee={employee}
          isPrivileged={isPrivileged}
          onSaved={() => {
            setEditOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

const DOC_TYPE_PRESETS = ["KTP", "Kontrak Kerja", "Ijazah", "NPWP", "BPJS"];

function DocumentUploadForm({
  employeeId,
  onUploaded,
}: {
  employeeId: string;
  onUploaded: () => void;
}) {
  const [docType, setDocType] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const customRequest: NonNullable<UploadProps["customRequest"]> = async (options) => {
    const { file, onSuccess, onError } = options;
    if (!docType) {
      message.error("Pilih jenis dokumen terlebih dahulu");
      onError?.(new Error("docType required"));
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("docType", docType);
      await api.post(`/employees/${employeeId}/documents`, formData);
      message.success("Dokumen berhasil diunggah");
      onSuccess?.({});
      setDocType(undefined);
      onUploaded();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal mengunggah dokumen");
      onError?.(err instanceof Error ? err : new Error("upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AutoComplete
        placeholder="Jenis dokumen (mis. KTP)"
        className="w-48"
        value={docType}
        onChange={setDocType}
        options={DOC_TYPE_PRESETS.map((t) => ({ value: t }))}
        filterOption={(inputValue, option) =>
          (option?.value ?? "").toLowerCase().includes(inputValue.toLowerCase())
        }
      />
      <Upload customRequest={customRequest} showUploadList={false} disabled={uploading}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          Unggah Dokumen
        </Button>
      </Upload>
    </div>
  );
}

interface EditFormValues {
  fullName?: string;
  address?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  hireDate?: dayjs.Dayjs;
  baseSalary?: number;
  allowance?: number;
}

function EditEmployeeModal({
  open,
  onClose,
  employee,
  isPrivileged,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employee: EmployeeDetail;
  isPrivileged: boolean;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<EditFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const { data: departments } = useApiGet<Department[]>(isPrivileged && open ? "/departments" : null);
  const departmentIdWatch = Form.useWatch("departmentId", form);
  const effectiveDepartmentId = departmentIdWatch ?? employee.department?.id;
  const { data: positions } = useApiGet<Position[]>(
    isPrivileged && open
      ? effectiveDepartmentId
        ? `/positions?departmentId=${effectiveDepartmentId}`
        : "/positions"
      : null,
    [effectiveDepartmentId],
  );

  const initialValues: EditFormValues = {
    fullName: employee.fullName,
    address: employee.address ?? undefined,
    phone: employee.phone ?? undefined,
    email: employee.email ?? undefined,
    departmentId: employee.department?.id,
    positionId: employee.position?.id,
    baseSalary: employee.baseSalary,
    allowance: employee.allowance ?? undefined,
    hireDate: employee.hireDate ? dayjs(employee.hireDate) : undefined,
  };

  const onFinish = async (values: EditFormValues) => {
    setSubmitting(true);
    try {
      const body = isPrivileged
        ? { ...values, hireDate: values.hireDate ? values.hireDate.format("YYYY-MM-DD") : undefined }
        : { address: values.address, phone: values.phone, email: values.email };
      await api.patch(`/employees/${employee.id}`, body);
      message.success("Data karyawan berhasil diperbarui");
      onSaved();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal memperbarui data karyawan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Edit Karyawan"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      afterOpenChange={(isOpen) => {
        if (isOpen) form.setFieldsValue(initialValues);
      }}
    >
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish} disabled={submitting}>
        {isPrivileged && (
          <Form.Item label="Nama Lengkap" name="fullName" rules={[{ required: true, message: "Nama wajib diisi" }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Telepon" name="phone">
          <Input />
        </Form.Item>
        <Form.Item label="Alamat" name="address">
          <Input.TextArea rows={2} />
        </Form.Item>

        {isPrivileged && (
          <>
            <Form.Item label="Departemen" name="departmentId">
              <Select
                placeholder="Pilih departemen"
                allowClear
                options={departments?.map((d) => ({ value: d.id, label: d.name }))}
                onChange={() => form.setFieldValue("positionId", undefined)}
              />
            </Form.Item>
            <Form.Item label="Jabatan" name="positionId">
              <Select
                placeholder="Pilih jabatan"
                allowClear
                options={positions?.map((p) => ({ value: p.id, label: p.title }))}
              />
            </Form.Item>
            <Form.Item label="Tanggal Masuk" name="hireDate">
              <DatePicker className="w-full" format="DD-MM-YYYY" />
            </Form.Item>
            <Form.Item label="Gaji Pokok" name="baseSalary">
              <InputNumber className="w-full" min={0} step={100000} />
            </Form.Item>
            <Form.Item label="Tunjangan" name="allowance">
              <InputNumber className="w-full" min={0} step={50000} />
            </Form.Item>
          </>
        )}

        <Form.Item className="!mb-0 !mt-4">
          <Button type="primary" htmlType="submit" loading={submitting}>
            Simpan
          </Button>
          <Button className="ml-2" onClick={onClose}>
            Batal
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

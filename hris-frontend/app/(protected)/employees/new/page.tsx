"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
} from "antd";
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

interface EmployeeOption {
  id: string;
  fullName: string;
}

interface CreateEmployeeForm {
  nik: string;
  fullName: string;
  address?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  hireDate: dayjs.Dayjs;
  baseSalary: number;
  allowance?: number;
}

export default function NewEmployeePage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm<CreateEmployeeForm>();
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const { data: departments } = useApiGet<Department[]>(canCreate ? "/departments" : null);
  const departmentId = Form.useWatch("departmentId", form);
  const { data: positions } = useApiGet<Position[]>(
    canCreate && departmentId ? `/positions?departmentId=${departmentId}` : canCreate ? "/positions" : null,
    [departmentId],
  );
  const { data: employees } = useApiGet<EmployeeOption[]>(canCreate ? "/employees" : null);

  if (!canCreate) {
    return <Result status="403" title="Akses Ditolak" subTitle="Anda tidak memiliki izin untuk membuat karyawan baru." />;
  }

  const onFinish = async (values: CreateEmployeeForm) => {
    setSubmitting(true);
    try {
      await api.post("/employees", {
        ...values,
        hireDate: values.hireDate.format("YYYY-MM-DD"),
      });
      message.success("Karyawan berhasil ditambahkan");
      router.push("/employees");
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal menambahkan karyawan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Tambah Karyawan</h1>
        <p className="text-sm text-text-secondary">Isi data karyawan baru</p>
      </div>

      <Card className="animate-fade-in-up max-w-3xl rounded-xl shadow-sm" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={submitting}
        >
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              label="NIK"
              name="nik"
              rules={[{ required: true, message: "NIK wajib diisi" }]}
            >
              <Input placeholder="NIK karyawan" />
            </Form.Item>
            <Form.Item
              label="Nama Lengkap"
              name="fullName"
              rules={[{ required: true, message: "Nama wajib diisi" }]}
            >
              <Input placeholder="Nama lengkap" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
              <Input placeholder="nama@perusahaan.com" />
            </Form.Item>
            <Form.Item label="Telepon" name="phone">
              <Input placeholder="08xxxxxxxxxx" />
            </Form.Item>
            <Form.Item label="Alamat" name="address" className="md:col-span-2">
              <Input.TextArea rows={2} placeholder="Alamat lengkap" />
            </Form.Item>
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
            <Form.Item label="Manager" name="managerId">
              <Select
                placeholder="Pilih manager"
                allowClear
                showSearch
                optionFilterProp="label"
                options={employees?.map((e) => ({ value: e.id, label: e.fullName }))}
              />
            </Form.Item>
            <Form.Item
              label="Tanggal Masuk"
              name="hireDate"
              rules={[{ required: true, message: "Tanggal masuk wajib diisi" }]}
            >
              <DatePicker className="w-full" format="DD-MM-YYYY" />
            </Form.Item>
            <Form.Item
              label="Gaji Pokok"
              name="baseSalary"
              rules={[{ required: true, message: "Gaji pokok wajib diisi" }]}
            >
              <InputNumber<number>
                className="w-full"
                min={0}
                step={100000}
                formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0)}
              />
            </Form.Item>
            <Form.Item label="Tunjangan" name="allowance">
              <InputNumber<number>
                className="w-full"
                min={0}
                step={50000}
                formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0)}
              />
            </Form.Item>
          </div>

          <Form.Item className="!mb-0 !mt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="primary" htmlType="submit" loading={submitting} className="w-full sm:w-auto">
                Simpan
              </Button>
              <Button className="w-full sm:ml-2 sm:w-auto" onClick={() => router.push("/employees")}>
                Batal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

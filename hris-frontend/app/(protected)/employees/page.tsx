"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Card, Input, Select, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  nik: string;
  fullName: string;
  email?: string | null;
  status: "ACTIVE" | "INACTIVE" | "RESIGNED";
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
  { value: "RESIGNED", label: "Resign" },
];

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
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const { data: departments } = useApiGet<Department[]>("/departments");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    if (status) params.set("status", status);
    const qs = params.toString();
    return `/employees${qs ? `?${qs}` : ""}`;
  }, [search, departmentId, status]);

  const { data, loading, error } = useApiGet<Employee[]>(query, [query]);

  const canCreate = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const columns: TableColumnsType<Employee> = [
    { title: "NIK", dataIndex: "nik", key: "nik", width: 140 },
    {
      title: "Nama",
      dataIndex: "fullName",
      key: "fullName",
      render: (value: string, record) => <Link href={`/employees/${record.id}`}>{value}</Link>,
    },
    {
      title: "Departemen",
      key: "department",
      render: (_, record) => record.department?.name ?? "-",
    },
    {
      title: "Jabatan",
      key: "position",
      render: (_, record) => record.position?.title ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>,
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => <Link href={`/employees/${record.id}`}>Detail</Link>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Karyawan</h1>
          <p className="text-zinc-500">Daftar seluruh karyawan</p>
        </div>
        {canCreate && (
          <Link href="/employees/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Tambah Karyawan
            </Button>
          </Link>
        )}
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input.Search
            placeholder="Cari nama atau NIK..."
            allowClear
            defaultValue={search}
            onSearch={setSearch}
            className="w-64"
          />
          <Select
            placeholder="Departemen"
            allowClear
            className="w-48"
            value={departmentId}
            onChange={setDepartmentId}
            options={departments?.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select
            placeholder="Status"
            allowClear
            className="w-40"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={data ?? []}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
}

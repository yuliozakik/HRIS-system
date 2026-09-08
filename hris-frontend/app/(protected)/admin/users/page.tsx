"use client";

import { useState } from "react";
import { Alert, Card, Result, Select, Switch, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { api, ApiError } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

interface Role {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  email: string;
  isActive: boolean;
  role?: Role | null;
  roleId?: string;
  employee?: { fullName: string } | null;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const isAllowed = user?.role === "SUPERADMIN";

  const { data, loading, error, reload } = useApiGet<AdminUser[]>(
    isAllowed ? "/admin/users" : null,
  );
  const { data: roles } = useApiGet<Role[]>(isAllowed ? "/admin/roles" : null);

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  if (!isAllowed) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function handleRoleChange(row: AdminUser, roleId: string) {
    setSavingRoleId(row.id);
    try {
      await api.patch(`/admin/users/${row.id}`, { roleId });
      message.success("Role berhasil diperbarui");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal memperbarui role");
    } finally {
      setSavingRoleId(null);
    }
  }

  async function handleStatusChange(row: AdminUser, isActive: boolean) {
    setSavingStatusId(row.id);
    try {
      await api.patch(`/admin/users/${row.id}`, { isActive });
      message.success("Status berhasil diperbarui");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal memperbarui status");
    } finally {
      setSavingStatusId(null);
    }
  }

  const columns: ColumnsType<AdminUser> = [
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Nama Karyawan",
      key: "employee",
      render: (_, record) => record.employee?.fullName ?? "-",
    },
    {
      title: "Role",
      key: "role",
      width: 220,
      render: (_, record) => (
        <Select
          className="w-full"
          value={record.role?.id ?? record.roleId}
          loading={savingRoleId === record.id}
          disabled={savingRoleId === record.id}
          onChange={(value) => handleRoleChange(record, value)}
          options={roles?.map((r) => ({ value: r.id, label: r.name }))}
        />
      ),
    },
    {
      title: "Status",
      key: "isActive",
      width: 120,
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          loading={savingStatusId === record.id}
          onChange={(checked) => handleStatusChange(record, checked)}
          checkedChildren="Aktif"
          unCheckedChildren="Nonaktif"
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Kelola Akses</h1>
        <p className="text-sm text-text-secondary">Kelola role dan status akun pengguna</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card className="animate-fade-in-up rounded-xl shadow-sm" bordered={false}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            columns={columns}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>
    </div>
  );
}

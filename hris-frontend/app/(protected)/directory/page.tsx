"use client";

import { useMemo, useState } from "react";
import { Alert, Avatar, Empty, Input, Skeleton } from "antd";
import { BankOutlined, IdcardOutlined, MailOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useApiGet } from "@/lib/hooks";

interface DirectoryEntry {
  id: string;
  fullName: string;
  email: string | null;
  department: { name: string } | null;
  position: { title: string } | null;
  manager: { id: string; fullName: string } | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useApiGet<DirectoryEntry[]>("/employees/directory");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.position?.title.toLowerCase().includes(q) ||
        e.department?.name.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Direktori Karyawan</h1>
        <p className="text-sm text-text-secondary">Daftar rekan kerja beserta jabatan dan departemen</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Input.Search
        placeholder="Cari nama, jabatan, atau departemen..."
        allowClear
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <Empty description="Tidak ada karyawan yang cocok" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e, i) => (
            <div
              key={e.id}
              className="animate-fade-in-up flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <Avatar size={44} icon={<UserOutlined />} className="!bg-brand-blue-subtle !text-primary-container shrink-0">
                {initials(e.fullName)}
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-text-primary">
                  {e.fullName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                  <BankOutlined /> {e.position?.title ?? "-"}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                  <TeamOutlined /> {e.department?.name ?? "-"}
                </p>
                {e.email && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                    <MailOutlined /> {e.email}
                  </p>
                )}
                {e.manager && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                    <IdcardOutlined /> Atasan: {e.manager.fullName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

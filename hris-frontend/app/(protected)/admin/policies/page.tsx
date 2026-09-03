"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, InputNumber, Result, Space, Table, Typography, message } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { api, ApiError } from "@/lib/api";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

type PolicyValue = string | number | boolean | null;
type PolicyMap = Record<string, PolicyValue>;

interface SuggestedPolicy {
  key: string;
  label: string;
  numeric: boolean;
}

const SUGGESTED_POLICIES: SuggestedPolicy[] = [
  { key: "annualLeaveDefaultDays", label: "Jatah Cuti Tahunan Default (hari)", numeric: true },
  { key: "payrollCutoffDay", label: "Tanggal Cutoff Payroll", numeric: true },
];

interface PolicyRow {
  key: string;
  label: string;
  numeric: boolean;
  value: PolicyValue;
}

export default function AdminPoliciesPage() {
  const { user } = useAuth();
  const isAllowed = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const { data, loading, error, reload } = useApiGet<PolicyMap>(
    isAllowed ? "/admin/policies" : null,
  );

  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const rows: PolicyRow[] = useMemo(() => {
    const policies = data ?? {};
    const suggestedKeys = new Set(SUGGESTED_POLICIES.map((s) => s.key));

    const suggestedRows: PolicyRow[] = SUGGESTED_POLICIES.map((s) => ({
      key: s.key,
      label: s.label,
      numeric: s.numeric,
      value: Object.prototype.hasOwnProperty.call(policies, s.key) ? policies[s.key] : null,
    }));

    const otherRows: PolicyRow[] = Object.keys(policies)
      .filter((k) => !suggestedKeys.has(k))
      .map((k) => ({
        key: k,
        label: k,
        numeric: typeof policies[k] === "number",
        value: policies[k],
      }));

    return [...suggestedRows, ...otherRows];
  }, [data]);

  // Sync local editable text state whenever fetched data changes.
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const row of rows) {
      initial[row.key] = row.value === null || row.value === undefined ? "" : String(row.value);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs editable form state whenever fetched policies change
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!isAllowed) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  async function saveKey(key: string, rawValue: string, numeric: boolean) {
    setSavingKey(key);
    try {
      const value: PolicyValue = numeric && rawValue !== "" ? Number(rawValue) : rawValue;
      await api.put(`/admin/policies/${encodeURIComponent(key)}`, { value });
      message.success("Kebijakan berhasil disimpan");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal menyimpan kebijakan");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleAddNew() {
    const key = newKey.trim();
    if (!key) {
      message.error("Key kebijakan wajib diisi");
      return;
    }
    setAddingNew(true);
    try {
      await api.put(`/admin/policies/${encodeURIComponent(key)}`, { value: newValue });
      message.success("Kebijakan berhasil ditambahkan");
      setNewKey("");
      setNewValue("");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal menambahkan kebijakan");
    } finally {
      setAddingNew(false);
    }
  }

  const columns: ColumnsType<PolicyRow> = [
    { title: "Kebijakan", dataIndex: "label", key: "label", width: 320 },
    {
      title: "Nilai",
      key: "value",
      render: (_, record) =>
        record.numeric ? (
          <InputNumber
            className="w-full"
            value={values[record.key] === "" ? undefined : Number(values[record.key])}
            onChange={(v) =>
              setValues((prev) => ({ ...prev, [record.key]: v === null ? "" : String(v) }))
            }
            placeholder="Belum diatur"
          />
        ) : (
          <Input
            value={values[record.key] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [record.key]: e.target.value }))}
            placeholder="Belum diatur"
          />
        ),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          icon={<SaveOutlined />}
          loading={savingKey === record.key}
          onClick={() => saveKey(record.key, values[record.key] ?? "", record.numeric)}
        >
          Simpan
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Kebijakan</h1>
        <p className="text-zinc-500">Kelola konfigurasi kebijakan perusahaan</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card title="Daftar Kebijakan">
        <Table
          rowKey="key"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Card title="Tambah Kebijakan Baru">
        <Typography.Paragraph type="secondary">
          Tambahkan key kebijakan lain yang belum ada di daftar di atas.
        </Typography.Paragraph>
        <Space wrap>
          <Input
            placeholder="Key (contoh: overtimeRatePerHour)"
            className="w-64"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <Input
            placeholder="Nilai"
            className="w-64"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} loading={addingNew} onClick={handleAddNew}>
            Tambah
          </Button>
        </Space>
      </Card>
    </div>
  );
}

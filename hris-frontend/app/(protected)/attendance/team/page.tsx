"use client";

import { useMemo, useState } from "react";
import { Alert, Card, DatePicker, Result, Table, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";

const { RangePicker } = DatePicker;

interface TeamAttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";
  lateMinutes: number | null;
  overtimeMinutes: number | null;
  employee: { id: string; fullName: string };
}

function statusColor(status: string) {
  switch (status) {
    case "ON_TIME":
      return "green";
    case "LATE":
      return "orange";
    case "ABSENT":
      return "red";
    case "LEAVE":
      return "blue";
    default:
      return "default";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "ON_TIME":
      return "Tepat Waktu";
    case "LATE":
      return "Terlambat";
    case "ABSENT":
      return "Absen";
    case "LEAVE":
      return "Cuti";
    default:
      return status;
  }
}

export default function TeamAttendancePage() {
  const { user } = useAuth();
  const canView =
    user?.role === "MANAGER" || user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const query = useMemo(() => {
    const from = range[0].format("YYYY-MM-DD");
    const to = range[1].format("YYYY-MM-DD");
    return `/attendance/team?from=${from}&to=${to}`;
  }, [range]);

  const { data, loading, error } = useApiGet<TeamAttendanceRow[]>(canView ? query : null, [query]);

  if (!canView) {
    return (
      <Result status="403" title="Akses Ditolak" subTitle="Halaman ini hanya untuk manager/HR." />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Rekap Absensi Tim</h1>
        <p className="text-zinc-500">Ringkasan kehadiran anggota tim</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <div className="mb-4">
          <RangePicker
            value={range}
            format="DD-MM-YYYY"
            allowClear={false}
            onChange={(values) => {
              const start = values?.[0];
              const end = values?.[1];
              if (start && end) {
                setRange([start, end]);
              }
            }}
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={data ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Karyawan",
              key: "employee",
              render: (_, record) => record.employee?.fullName ?? "-",
            },
            {
              title: "Tanggal",
              dataIndex: "date",
              render: (value: string) => dayjs(value).format("DD-MM-YYYY"),
            },
            {
              title: "Check In",
              dataIndex: "checkIn",
              render: (value: string | null) => (value ? dayjs(value).format("HH:mm") : "-"),
            },
            {
              title: "Check Out",
              dataIndex: "checkOut",
              render: (value: string | null) => (value ? dayjs(value).format("HH:mm") : "-"),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (value: string) => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>,
            },
            {
              title: "Telat (menit)",
              dataIndex: "lateMinutes",
              render: (value: number | null) => value ?? 0,
            },
            {
              title: "Lembur (menit)",
              dataIndex: "overtimeMinutes",
              render: (value: number | null) => value ?? 0,
            },
          ]}
        />
      </Card>
    </div>
  );
}

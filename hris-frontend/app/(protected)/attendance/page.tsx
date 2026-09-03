"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Card, Table, Tag, message } from "antd";
import { CheckCircleOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useApiGet } from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";

interface AttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";
  lateMinutes: number | null;
  overtimeMinutes: number | null;
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

export default function AttendancePage() {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const from = useMemo(() => dayjs().subtract(30, "day").format("YYYY-MM-DD"), []);
  const to = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const { data, loading, error, reload } = useApiGet<AttendanceRow[]>(
    `/attendance/me?from=${from}&to=${to}`,
  );

  const today = dayjs().format("YYYY-MM-DD");
  const todayRow = data?.find((row) => dayjs(row.date).format("YYYY-MM-DD") === today);
  const hasCheckedIn = !!todayRow?.checkIn;
  const hasCheckedOut = !!todayRow?.checkOut;

  const onCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post("/attendance/check-in");
      message.success("Check in berhasil");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal melakukan check in");
    } finally {
      setCheckingIn(false);
    }
  };

  const onCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.post("/attendance/check-out");
      message.success("Check out berhasil");
      reload();
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : "Gagal melakukan check out");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Absensi Saya</h1>
        <p className="text-zinc-500">Catat kehadiran harian Anda</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            loading={checkingIn}
            disabled={hasCheckedIn}
            onClick={onCheckIn}
          >
            Check In
          </Button>
          <Button
            size="large"
            icon={<LogoutOutlined />}
            loading={checkingOut}
            disabled={!hasCheckedIn || hasCheckedOut}
            onClick={onCheckOut}
          >
            Check Out
          </Button>
          {hasCheckedIn && hasCheckedOut && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircleOutlined /> Absensi hari ini selesai
            </span>
          )}
        </div>
      </Card>

      <Card title="Riwayat Absensi">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data ?? []}
          pagination={{ pageSize: 10 }}
          columns={[
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

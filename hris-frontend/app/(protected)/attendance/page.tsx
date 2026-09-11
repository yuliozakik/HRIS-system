"use client";

import { useMemo, useState } from "react";
import { Alert, App, Button, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
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
  const { message } = App.useApp();
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

  const statusText = !todayRow
    ? "Belum absen"
    : hasCheckedIn && hasCheckedOut
      ? "Absensi selesai"
      : hasCheckedIn
        ? "Sudah check in"
        : "Belum absen";

  const columns: ColumnsType<AttendanceRow> = [
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
      responsive: ["sm"],
      render: (value: number | null) => value ?? 0,
    },
    {
      title: "Lembur (menit)",
      dataIndex: "overtimeMinutes",
      responsive: ["sm"],
      render: (value: number | null) => value ?? 0,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Absensi Saya</h1>
        <p className="text-sm text-text-secondary">Catat kehadiran harian Anda</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <div className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
              <ClockCircleOutlined />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Status Hari Ini</p>
              <p className="font-heading text-base font-semibold text-text-primary">{statusText}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              loading={checkingIn}
              disabled={hasCheckedIn}
              onClick={onCheckIn}
              block
              className="sm:!w-auto"
            >
              Check In
            </Button>
            <Button
              size="large"
              icon={<LogoutOutlined />}
              loading={checkingOut}
              disabled={!hasCheckedIn || hasCheckedOut}
              onClick={onCheckOut}
              block
              className="sm:!w-auto"
            >
              Check Out
            </Button>
          </div>
        </div>
        {hasCheckedIn && hasCheckedOut && (
          <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-status-success-subtle px-3 py-2 text-sm font-medium text-status-success">
            <CheckCircleOutlined /> Absensi hari ini selesai
          </div>
        )}
      </div>

      <div
        className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">
          Riwayat Absensi
        </h2>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            columns={columns}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
                    <ClockCircleOutlined />
                  </div>
                  <span className="text-sm text-text-muted">Belum ada riwayat absensi</span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

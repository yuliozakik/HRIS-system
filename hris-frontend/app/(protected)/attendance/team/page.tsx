"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, DatePicker, Result, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";

const LocationMap = dynamic(() => import("@/lib/components/LocationMap"), { ssr: false });

const { RangePicker } = DatePicker;

interface TeamAttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
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

  const columns: ColumnsType<TeamAttendanceRow> = [
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
      responsive: ["sm"],
      render: (value: number | null) => value ?? 0,
    },
    {
      title: "Lembur (menit)",
      dataIndex: "overtimeMinutes",
      responsive: ["sm"],
      render: (value: number | null) => value ?? 0,
    },
    {
      title: "Lokasi",
      key: "location",
      render: (_, record) =>
        record.checkInLat != null ? (
          <span className="inline-flex items-center gap-1 text-status-success">
            <EnvironmentOutlined /> Tercatat
          </span>
        ) : (
          <span className="text-text-muted">-</span>
        ),
    },
  ];

  const isCompanyWide = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">
          {isCompanyWide ? "Log Absensi Karyawan" : "Rekap Absensi Tim"}
        </h1>
        <p className="text-sm text-text-secondary">
          {isCompanyWide
            ? "Riwayat kehadiran seluruh karyawan, lengkap dengan lokasi absen"
            : "Ringkasan kehadiran anggota tim"}
        </p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <div className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap gap-3">
          <RangePicker
            value={range}
            format="DD-MM-YYYY"
            allowClear={false}
            className="w-full sm:w-auto"
            onChange={(values) => {
              const start = values?.[0];
              const end = values?.[1];
              if (start && end) {
                setRange([start, end]);
              }
            }}
          />
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={data ?? []}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            columns={columns}
            expandable={{
              rowExpandable: (record) => record.checkInLat != null || record.checkOutLat != null,
              expandedRowRender: (record) => (
                <div className="flex flex-col gap-3 sm:flex-row">
                  {record.checkInLat != null && record.checkInLng != null && (
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-medium text-text-secondary">Lokasi Check In</p>
                      <LocationMap lat={record.checkInLat} lng={record.checkInLng} height={140} />
                    </div>
                  )}
                  {record.checkOutLat != null && record.checkOutLng != null && (
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-medium text-text-secondary">Lokasi Check Out</p>
                      <LocationMap lat={record.checkOutLat} lng={record.checkOutLng} height={140} />
                    </div>
                  )}
                </div>
              ),
            }}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-subtle text-lg text-primary-container">
                    <TeamOutlined />
                  </div>
                  <span className="text-sm text-text-muted">
                    Tidak ada data absensi pada rentang ini
                  </span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

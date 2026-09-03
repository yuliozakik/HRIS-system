"use client";

import type { ReactNode } from "react";
import { Alert, Skeleton, Table, Tag } from "antd";
import {
  ArrowUpOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";
import type { RoleName } from "@/lib/types";

interface ReportSummary {
  totalEmployees: number;
  activeEmployees: number;
  employeesByDepartment: { departmentName: string; count: number }[];
  turnoverRateYtd: number;
  pendingLeaveRequests: number;
  latestPayrollRun: { period: string; status: string } | null;
  attendanceThisMonth: { totalLate: number; totalAbsent: number };
}

interface AttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface LeaveBalance {
  id: string;
  leaveType: string;
  balance: number;
}

interface PayslipSummary {
  id: string;
  period: string;
  runStatus: string;
}

const ORG_VIEW_ROLES = ["HR_ADMIN", "SUPERADMIN", "MANAGER"];

const ROLE_LABEL: Record<RoleName, string> = {
  EMPLOYEE: "Karyawan",
  MANAGER: "Manager",
  HR_ADMIN: "HR Admin",
  SUPERADMIN: "Superadmin",
};

function greetingForNow() {
  const h = dayjs().hour();
  if (h < 11) return "Pagi";
  if (h < 15) return "Siang";
  if (h < 18) return "Sore";
  return "Malam";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isOrgView = !!user && ORG_VIEW_ROLES.includes(user.role);
  const today = dayjs().locale("id").format("dddd, D MMMM YYYY");

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up relative overflow-hidden rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-brand-blue-subtle blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-info-subtle px-2.5 py-0.5 text-xs font-medium text-status-info">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-info" />
              {user ? ROLE_LABEL[user.role] : ""}
            </span>
            <span className="text-text-muted">•</span>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <CalendarOutlined /> {today}
            </span>
          </div>
          <h1 className="font-heading text-xl text-text-primary sm:text-2xl">
            Selamat {greetingForNow()}, {user?.fullName}
          </h1>
          <p className="max-w-2xl text-sm text-text-secondary">
            {isOrgView
              ? "Berikut ringkasan data SDM perusahaan Anda hari ini."
              : "Berikut ringkasan aktivitas Anda hari ini."}
          </p>
        </div>
      </div>

      {isOrgView ? <OrgSummary /> : <EmployeeSummary employeeId={user?.employeeId ?? null} />}
    </div>
  );
}

function KpiCard({
  title,
  value,
  suffix,
  icon,
  tint,
  trend,
  delay = 0,
}: {
  title: string;
  value: ReactNode;
  suffix?: string;
  icon: ReactNode;
  tint: "blue" | "success" | "warning" | "tertiary";
  trend?: string;
  delay?: number;
}) {
  const tintClass = {
    blue: "bg-brand-blue-subtle text-primary-container",
    success: "bg-status-success-subtle text-status-success",
    warning: "bg-status-warning-subtle text-status-warning",
    tertiary: "bg-surface-container text-tertiary",
  }[tint];

  return (
    <div
      className="animate-fade-in-up rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${tintClass}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-heading text-2xl font-bold text-text-primary">{value}</span>
        {suffix && <span className="text-sm text-text-secondary">{suffix}</span>}
      </div>
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-status-success">
          <ArrowUpOutlined className="text-[10px]" />
          {trend}
        </div>
      )}
    </div>
  );
}

function OrgSummary() {
  const { data, loading, error } = useApiGet<ReportSummary>("/reports/summary");

  if (error) return <Alert type="error" showIcon message={error} />;
  if (loading || !data) return <Skeleton active />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Karyawan Aktif"
          value={data.activeEmployees}
          suffix={`/ ${data.totalEmployees}`}
          icon={<TeamOutlined />}
          tint="blue"
        />
        <KpiCard
          title="Cuti Menunggu Persetujuan"
          value={data.pendingLeaveRequests}
          icon={<FileTextOutlined />}
          tint="warning"
          delay={80}
        />
        <KpiCard
          title="Turnover (YTD)"
          value={`${(data.turnoverRateYtd * 100).toFixed(1)}%`}
          icon={<UserSwitchOutlined />}
          tint="tertiary"
          delay={160}
        />
        <KpiCard
          title="Keterlambatan Bulan Ini"
          value={data.attendanceThisMonth.totalLate}
          suffix="menit"
          icon={<ClockCircleOutlined />}
          tint="success"
          delay={240}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="animate-fade-in-up rounded-xl bg-white p-5 shadow-sm lg:col-span-7 [animation-delay:320ms]">
          <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">
            Karyawan per Departemen
          </h2>
          <Table
            size="small"
            pagination={false}
            rowKey="departmentName"
            dataSource={data.employeesByDepartment}
            columns={[
              { title: "Departemen", dataIndex: "departmentName" },
              { title: "Jumlah", dataIndex: "count", width: 120 },
            ]}
          />
        </div>
        <div className="animate-fade-in-up rounded-xl bg-white p-5 shadow-sm lg:col-span-5 [animation-delay:400ms]">
          <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">
            Payroll Run Terbaru
          </h2>
          {data.latestPayrollRun ? (
            <div className="flex items-center justify-between rounded-lg bg-surface-subtle px-4 py-3">
              <span className="text-lg font-medium text-text-primary">
                {data.latestPayrollRun.period}
              </span>
              <Tag color={statusColor(data.latestPayrollRun.status)}>
                {data.latestPayrollRun.status}
              </Tag>
            </div>
          ) : (
            <span className="text-text-muted">Belum ada payroll run</span>
          )}
        </div>
      </div>
    </>
  );
}

function EmployeeSummary({ employeeId }: { employeeId: string | null }) {
  const today = dayjs().format("YYYY-MM-DD");
  const { data: attendance, loading: loadingAttendance } = useApiGet<AttendanceRow[]>(
    `/attendance/me?from=${today}&to=${today}`,
  );
  const { data: balances, loading: loadingBalances } = useApiGet<LeaveBalance[]>(
    employeeId ? `/leave-balances/${employeeId}` : null,
  );
  const { data: payslips, loading: loadingPayslips } = useApiGet<PayslipSummary[]>(
    employeeId ? `/payslips/${employeeId}` : null,
  );

  const todayRow = attendance?.[0];
  const annualBalance = balances?.find((b) => b.leaveType === "ANNUAL");
  const latestPayslip = payslips?.[0];
  const loading = loadingAttendance || loadingBalances || loadingPayslips;

  if (loading) return <Skeleton active />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <KpiCard
            title="Absensi Hari Ini"
            value={todayRow?.checkIn ? dayjs(todayRow.checkIn).format("HH:mm") : "Belum absen"}
            icon={<ClockCircleOutlined />}
            tint="blue"
          />
          {!todayRow?.checkIn && (
            <Link
              href="/attendance"
              className="mt-2 inline-block text-sm text-primary-container hover:underline"
            >
              Check in sekarang →
            </Link>
          )}
        </div>
        <KpiCard
          title="Sisa Cuti Tahunan"
          value={annualBalance?.balance ?? 0}
          suffix="hari"
          icon={<CalendarOutlined />}
          tint="success"
          delay={80}
        />
        <KpiCard
          title="Slip Gaji Terbaru"
          value={latestPayslip ? latestPayslip.period : "Belum ada"}
          icon={<WalletOutlined />}
          tint="tertiary"
          delay={160}
        />
      </div>

      <div className="animate-fade-in-up mt-4 rounded-xl bg-white p-5 shadow-sm [animation-delay:240ms]">
        <h2 className="mb-3 font-heading text-base font-semibold text-text-primary">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-container"
          >
            <ClockCircleOutlined /> Absensi Saya
          </Link>
          <Link
            href="/leave"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-container"
          >
            <CalendarOutlined /> Ajukan Cuti
          </Link>
          <Link
            href="/payslips"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-container"
          >
            <FileTextOutlined /> Slip Gaji
          </Link>
        </div>
      </div>
    </>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "PROCESSING":
      return "blue";
    case "FAILED":
      return "red";
    default:
      return "default";
  }
}

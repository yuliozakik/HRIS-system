"use client";

import { Alert, Button, Card, Col, Row, Skeleton, Statistic, Table, Tag } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const isOrgView = !!user && ORG_VIEW_ROLES.includes(user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 px-6 py-6 text-white shadow-md sm:px-8">
        <h1 className="text-xl font-semibold sm:text-2xl">Selamat datang, {user?.fullName} 👋</h1>
        <p className="mt-1 text-white/80">
          {isOrgView ? "Ringkasan data SDM perusahaan Anda" : "Ringkasan aktivitas Anda hari ini"}
        </p>
      </div>

      {isOrgView ? <OrgSummary /> : <EmployeeSummary employeeId={user?.employeeId ?? null} />}
    </div>
  );
}

function OrgSummary() {
  const { data, loading, error } = useApiGet<ReportSummary>("/reports/summary");

  if (error) return <Alert type="error" showIcon message={error} />;
  if (loading || !data) return <Skeleton active />;

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="animate-fade-in-up">
            <Statistic
              title="Karyawan Aktif"
              value={data.activeEmployees}
              suffix={`/ ${data.totalEmployees}`}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="animate-fade-in-up [animation-delay:80ms]">
            <Statistic
              title="Cuti Menunggu Persetujuan"
              value={data.pendingLeaveRequests}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="animate-fade-in-up [animation-delay:160ms]">
            <Statistic
              title="Turnover (YTD)"
              value={data.turnoverRateYtd * 100}
              precision={1}
              suffix="%"
              prefix={<UserSwitchOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="animate-fade-in-up [animation-delay:240ms]">
            <Statistic
              title="Keterlambatan Bulan Ini (menit)"
              value={data.attendanceThisMonth.totalLate}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Karyawan per Departemen" className="animate-fade-in-up [animation-delay:320ms]">
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
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Payroll Run Terbaru" className="animate-fade-in-up [animation-delay:400ms]">
            {data.latestPayrollRun ? (
              <div className="flex items-center justify-between">
                <span className="text-lg">{data.latestPayrollRun.period}</span>
                <Tag color={statusColor(data.latestPayrollRun.status)}>
                  {data.latestPayrollRun.status}
                </Tag>
              </div>
            ) : (
              <span className="text-zinc-400">Belum ada payroll run</span>
            )}
          </Card>
        </Col>
      </Row>
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

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="animate-fade-in-up" loading={loading}>
            <Statistic
              title="Absensi Hari Ini"
              value={todayRow?.checkIn ? dayjs(todayRow.checkIn).format("HH:mm") : "Belum absen"}
              prefix={<ClockCircleOutlined />}
            />
            {!loading && !todayRow?.checkIn && (
              <Link href="/attendance" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Check in sekarang →
              </Link>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="animate-fade-in-up [animation-delay:80ms]" loading={loading}>
            <Statistic
              title="Sisa Cuti Tahunan"
              value={annualBalance?.balance ?? 0}
              suffix="hari"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="animate-fade-in-up [animation-delay:160ms]" loading={loading}>
            <Statistic
              title="Slip Gaji Terbaru"
              value={latestPayslip ? latestPayslip.period : "Belum ada"}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Aksi Cepat" className="animate-fade-in-up [animation-delay:240ms]">
        <div className="flex flex-wrap gap-3">
          <Link href="/attendance">
            <Button icon={<ClockCircleOutlined />}>Absensi Saya</Button>
          </Link>
          <Link href="/leave">
            <Button icon={<CalendarOutlined />}>Ajukan Cuti</Button>
          </Link>
          <Link href="/payslips">
            <Button icon={<FileTextOutlined />}>Slip Gaji</Button>
          </Link>
        </div>
      </Card>
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

"use client";

import { Alert, Card, Col, Row, Skeleton, Statistic, Table, Tag } from "antd";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useApiGet<ReportSummary>("/reports/summary");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Selamat datang, {user?.fullName}</h1>
        <p className="text-zinc-500">Ringkasan data SDM</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      {loading || !data ? (
        <Skeleton active />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Karyawan Aktif"
                  value={data.activeEmployees}
                  suffix={`/ ${data.totalEmployees}`}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Cuti Menunggu Persetujuan"
                  value={data.pendingLeaveRequests}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
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
              <Card>
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
              <Card title="Karyawan per Departemen">
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
              <Card title="Payroll Run Terbaru">
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
      )}
    </div>
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

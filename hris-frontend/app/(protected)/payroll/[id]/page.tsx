"use client";

import { useParams } from "next/navigation";
import { Alert, Card, Descriptions, Result, Skeleton, Table, Tag } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useApiGet } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";

type PayrollStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";

interface PayrollDetail {
  id: string;
  employeeId: string;
  employee?: { fullName: string } | null;
  baseSalary: number | string;
  allowance: number | string;
  grossPay: number | string;
  deductions: number | string;
  netPay: number | string;
  payslipUrl?: string | null;
}

interface PayrollRunDetail {
  id: string;
  period: string;
  status: PayrollStatus;
  processedAt: string | null;
  createdAt: string;
  details?: PayrollDetail[];
  payrollDetails?: PayrollDetail[];
}

function statusColor(status: PayrollStatus) {
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

function statusLabel(status: PayrollStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PROCESSING":
      return "Diproses";
    case "COMPLETED":
      return "Selesai";
    case "FAILED":
      return "Gagal";
    default:
      return status;
  }
}

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
}

export default function PayrollRunDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const runId = params.id;

  const isAllowed = user?.role === "HR_ADMIN" || user?.role === "SUPERADMIN";

  const { data: run, loading, error } = useApiGet<PayrollRunDetail>(
    isAllowed && runId ? `/payroll-runs/${runId}` : null,
  );

  if (!isAllowed) {
    return <Result status="403" title="403" subTitle="Anda tidak memiliki akses ke halaman ini." />;
  }

  if (loading || !run) {
    return (
      <div className="flex flex-col gap-4">
        {error && <Alert type="error" showIcon message={error} />}
        <Skeleton active />
      </div>
    );
  }

  const details = run.details ?? run.payrollDetails ?? [];

  const columns: ColumnsType<PayrollDetail> = [
    {
      title: "Karyawan",
      key: "employee",
      render: (_, record) => record.employee?.fullName ?? record.employeeId,
    },
    {
      title: "Gaji Pokok",
      dataIndex: "baseSalary",
      key: "baseSalary",
      render: (value: number | string) => formatCurrency(value),
    },
    {
      title: "Tunjangan",
      dataIndex: "allowance",
      key: "allowance",
      render: (value: number | string) => formatCurrency(value),
    },
    {
      title: "Potongan",
      dataIndex: "deductions",
      key: "deductions",
      render: (value: number | string) => formatCurrency(value),
    },
    {
      title: "Gaji Bersih",
      dataIndex: "netPay",
      key: "netPay",
      render: (value: number | string) => formatCurrency(value),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl text-text-primary sm:text-2xl">Detail Payroll Run</h1>
        <p className="text-sm text-text-secondary">Periode {run.period}</p>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card
        title="Informasi Payroll Run"
        className="animate-fade-in-up rounded-xl shadow-sm"
        bordered={false}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Periode">{run.period}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={statusColor(run.status)}
              icon={run.status === "PROCESSING" ? <SyncOutlined spin /> : undefined}
            >
              {statusLabel(run.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Diproses Pada">
            {run.processedAt ? dayjs(run.processedAt).format("DD-MM-YYYY HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Dibuat Pada">
            {run.createdAt ? dayjs(run.createdAt).format("DD-MM-YYYY HH:mm") : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Rincian Gaji Karyawan"
        className="animate-fade-in-up rounded-xl shadow-sm [animation-delay:80ms]"
        bordered={false}
      >
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table
            rowKey="id"
            dataSource={details}
            columns={columns}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>
    </div>
  );
}

// Shared types/helpers for the Leave module pages.

export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  balance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: { id: string; fullName: string };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  approverId: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Tahunan",
  SICK: "Sakit",
  UNPAID: "Tanpa Gaji",
  OTHER: "Lainnya",
};

export const LEAVE_TYPE_OPTIONS = (
  Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]
).map((value) => ({ value, label: LEAVE_TYPE_LABELS[value] }));

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
};

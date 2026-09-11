// Shared types/helpers for the Reimbursement module pages.

export type ReimbursementCategory = "TRANSPORT" | "MEDICAL" | "MEALS" | "OTHER";
export type ReimbursementStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ReimbursementRequest {
  id: string;
  employeeId: string;
  employee?: { id: string; fullName: string };
  category: ReimbursementCategory;
  amount: string | number;
  description: string | null;
  receiptUrl: string | null;
  status: ReimbursementStatus;
  approverId: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export const REIMBURSEMENT_CATEGORY_LABELS: Record<ReimbursementCategory, string> = {
  TRANSPORT: "Transportasi",
  MEDICAL: "Medis / Kesehatan",
  MEALS: "Makan",
  OTHER: "Lainnya",
};

export const REIMBURSEMENT_CATEGORY_OPTIONS = (
  Object.keys(REIMBURSEMENT_CATEGORY_LABELS) as ReimbursementCategory[]
).map((value) => ({ value, label: REIMBURSEMENT_CATEGORY_LABELS[value] }));

export const REIMBURSEMENT_STATUS_LABELS: Record<ReimbursementStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export const REIMBURSEMENT_STATUS_COLORS: Record<ReimbursementStatus, string> = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
};

export function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
}

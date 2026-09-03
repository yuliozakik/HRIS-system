import type { RoleName } from "./types";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  roles?: RoleName[]; // omit = visible to all authenticated roles
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  {
    key: "employees",
    label: "Karyawan",
    href: "/employees",
    roles: ["HR_ADMIN", "SUPERADMIN", "MANAGER"],
  },
  { key: "attendance", label: "Absensi Saya", href: "/attendance" },
  {
    key: "attendance-team",
    label: "Rekap Absensi Tim",
    href: "/attendance/team",
    roles: ["MANAGER", "HR_ADMIN", "SUPERADMIN"],
  },
  { key: "leave", label: "Cuti Saya", href: "/leave" },
  {
    key: "leave-approvals",
    label: "Approval Cuti",
    href: "/leave/approvals",
    roles: ["MANAGER", "HR_ADMIN", "SUPERADMIN"],
  },
  {
    key: "payroll",
    label: "Payroll",
    href: "/payroll",
    roles: ["HR_ADMIN", "SUPERADMIN"],
  },
  { key: "payslips", label: "Slip Gaji Saya", href: "/payslips" },
  {
    key: "reports",
    label: "Laporan",
    href: "/reports",
    roles: ["HR_ADMIN", "SUPERADMIN", "MANAGER"],
  },
  {
    key: "admin-users",
    label: "Kelola Akses",
    href: "/admin/users",
    roles: ["SUPERADMIN"],
  },
  {
    key: "admin-policies",
    label: "Kebijakan",
    href: "/admin/policies",
    roles: ["HR_ADMIN", "SUPERADMIN"],
  },
];

export function navItemsForRole(role: RoleName): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

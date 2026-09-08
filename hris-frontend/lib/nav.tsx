import {
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  WalletOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { RoleName } from "./types";

/**
 * Keys of the (up to 3) items shown as primary bottom-tab-bar entries on
 * mobile, in order, before the trailing "More" tab. Kept short and
 * role-specific (Talenta-style: Home / <two most-used actions> / More).
 */
export const MOBILE_PRIMARY_KEYS: Record<RoleName, string[]> = {
  EMPLOYEE: ["attendance", "leave"],
  MANAGER: ["attendance-team", "leave-approvals"],
  HR_ADMIN: ["employees", "payroll"],
  SUPERADMIN: ["employees", "payroll"],
};

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: RoleName[]; // omit = visible to all authenticated roles
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: <DashboardOutlined /> },
  {
    key: "employees",
    label: "Karyawan",
    href: "/employees",
    icon: <TeamOutlined />,
    roles: ["HR_ADMIN", "SUPERADMIN", "MANAGER"],
  },
  { key: "attendance", label: "Absensi Saya", href: "/attendance", icon: <ClockCircleOutlined /> },
  {
    key: "attendance-team",
    label: "Rekap Absensi Tim",
    href: "/attendance/team",
    icon: <ScheduleOutlined />,
    roles: ["MANAGER", "HR_ADMIN", "SUPERADMIN"],
  },
  { key: "leave", label: "Cuti Saya", href: "/leave", icon: <CalendarOutlined /> },
  {
    key: "leave-approvals",
    label: "Approval Cuti",
    href: "/leave/approvals",
    icon: <CheckSquareOutlined />,
    roles: ["MANAGER", "HR_ADMIN", "SUPERADMIN"],
  },
  {
    key: "payroll",
    label: "Payroll",
    href: "/payroll",
    icon: <WalletOutlined />,
    roles: ["HR_ADMIN", "SUPERADMIN"],
  },
  { key: "payslips", label: "Slip Gaji Saya", href: "/payslips", icon: <FileTextOutlined /> },
  {
    key: "reports",
    label: "Laporan",
    href: "/reports",
    icon: <BarChartOutlined />,
    roles: ["HR_ADMIN", "SUPERADMIN", "MANAGER"],
  },
  {
    key: "admin-users",
    label: "Kelola Akses",
    href: "/admin/users",
    icon: <SafetyCertificateOutlined />,
    roles: ["SUPERADMIN"],
  },
  {
    key: "admin-policies",
    label: "Kebijakan",
    href: "/admin/policies",
    icon: <SettingOutlined />,
    roles: ["HR_ADMIN", "SUPERADMIN"],
  },
];

export function navItemsForRole(role: RoleName): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

/** Splits a role's nav items into the bottom-tab-bar primaries (Home + up to 2) and the rest (shown in the "More" sheet). */
export function mobileNavForRole(role: RoleName): { primary: NavItem[]; rest: NavItem[] } {
  const items = navItemsForRole(role);
  const home = items.find((i) => i.key === "dashboard");
  const primaryKeys = MOBILE_PRIMARY_KEYS[role] ?? [];
  const primaryPicked = primaryKeys
    .map((key) => items.find((i) => i.key === key))
    .filter((i): i is NavItem => !!i);
  const primary = [home, ...primaryPicked].filter((i): i is NavItem => !!i);
  const primaryKeySet = new Set(primary.map((i) => i.key));
  const rest = items.filter((i) => !primaryKeySet.has(i.key));
  return { primary, rest };
}

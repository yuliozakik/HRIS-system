export type RoleName = "EMPLOYEE" | "MANAGER" | "HR_ADMIN" | "SUPERADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  role: RoleName;
  employeeId: string | null;
  fullName: string;
}

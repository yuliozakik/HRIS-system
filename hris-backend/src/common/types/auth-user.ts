import { RoleName } from '../enums/role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: RoleName;
  employeeId: string | null;
}

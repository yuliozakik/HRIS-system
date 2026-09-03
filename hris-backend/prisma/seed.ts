import { PrismaClient, RoleName, LeaveType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

async function main() {
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  const engineering = await prisma.department.upsert({
    where: { id: 'seed-dept-engineering' },
    update: {},
    create: { id: 'seed-dept-engineering', name: 'Engineering' },
  });
  const hrDept = await prisma.department.upsert({
    where: { id: 'seed-dept-hr' },
    update: {},
    create: { id: 'seed-dept-hr', name: 'Human Resources' },
  });

  const posEngineer = await prisma.position.upsert({
    where: { id: 'seed-pos-engineer' },
    update: {},
    create: { id: 'seed-pos-engineer', title: 'Software Engineer', departmentId: engineering.id },
  });
  const posEngManager = await prisma.position.upsert({
    where: { id: 'seed-pos-eng-manager' },
    update: {},
    create: { id: 'seed-pos-eng-manager', title: 'Engineering Manager', departmentId: engineering.id },
  });
  const posHrAdmin = await prisma.position.upsert({
    where: { id: 'seed-pos-hr-admin' },
    update: {},
    create: { id: 'seed-pos-hr-admin', title: 'HR Administrator', departmentId: hrDept.id },
  });
  const posSuperadmin = await prisma.position.upsert({
    where: { id: 'seed-pos-superadmin' },
    update: {},
    create: { id: 'seed-pos-superadmin', title: 'System Administrator', departmentId: hrDept.id },
  });

  await prisma.shift.upsert({
    where: { id: 'seed-shift-reguler' },
    update: {},
    create: { id: 'seed-shift-reguler', name: 'Reguler', startTime: '09:00', endTime: '18:00' },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const managerEmployee = await prisma.employee.upsert({
    where: { nik: '3170000000000002' },
    update: {},
    create: {
      nik: '3170000000000002',
      fullName: 'Budi Manager',
      email: 'manager@hris.local',
      departmentId: engineering.id,
      positionId: posEngManager.id,
      hireDate: new Date('2022-01-10'),
      baseSalary: 20000000,
      allowance: 2000000,
    },
  });

  const employeeEmployee = await prisma.employee.upsert({
    where: { nik: '3170000000000001' },
    update: {},
    create: {
      nik: '3170000000000001',
      fullName: 'Ani Karyawan',
      email: 'employee@hris.local',
      departmentId: engineering.id,
      positionId: posEngineer.id,
      managerId: managerEmployee.id,
      hireDate: new Date('2023-03-01'),
      baseSalary: 10000000,
      allowance: 1000000,
    },
  });

  const hrEmployee = await prisma.employee.upsert({
    where: { nik: '3170000000000003' },
    update: {},
    create: {
      nik: '3170000000000003',
      fullName: 'Sari HR Admin',
      email: 'hradmin@hris.local',
      departmentId: hrDept.id,
      positionId: posHrAdmin.id,
      hireDate: new Date('2021-06-15'),
      baseSalary: 12000000,
      allowance: 1000000,
    },
  });

  const superadminEmployee = await prisma.employee.upsert({
    where: { nik: '3170000000000004' },
    update: {},
    create: {
      nik: '3170000000000004',
      fullName: 'Rudi Superadmin',
      email: 'superadmin@hris.local',
      departmentId: hrDept.id,
      positionId: posSuperadmin.id,
      hireDate: new Date('2020-01-01'),
      baseSalary: 15000000,
      allowance: 1000000,
    },
  });

  const demoUsers = [
    { email: 'employee@hris.local', role: roleByName.EMPLOYEE, employeeId: employeeEmployee.id },
    { email: 'manager@hris.local', role: roleByName.MANAGER, employeeId: managerEmployee.id },
    { email: 'hradmin@hris.local', role: roleByName.HR_ADMIN, employeeId: hrEmployee.id },
    { email: 'superadmin@hris.local', role: roleByName.SUPERADMIN, employeeId: superadminEmployee.id },
  ];

  for (const u of demoUsers) {
    await prisma.userAccount.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        roleId: u.role.id,
        employeeId: u.employeeId,
      },
    });
  }

  const currentYear = new Date().getFullYear();
  for (const employeeId of [employeeEmployee.id, managerEmployee.id, hrEmployee.id, superadminEmployee.id]) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: currentYear,
          leaveType: LeaveType.ANNUAL,
        },
      },
      update: {},
      create: { employeeId, year: currentYear, leaveType: LeaveType.ANNUAL, balance: 12 },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed selesai. Akun demo (password sama untuk semua):', DEMO_PASSWORD);
  demoUsers.forEach((u) => console.log(` - ${u.email} (${u.role.name})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

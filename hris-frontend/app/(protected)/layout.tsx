"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Dropdown, Layout, Menu, Spin, Typography } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { navItemsForRole, NAV_ITEMS } from "@/lib/nav";
import MobileTabBar from "./mobile-tab-bar";

const { Header, Sider, Content } = Layout;

const SEARCH_ROLES = ["HR_ADMIN", "SUPERADMIN", "MANAGER"];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = useMemo(() => (user ? navItemsForRole(user.role) : []), [user]);
  const operationalItems = useMemo(() => navItems.filter((i) => !i.key.startsWith("admin-")), [navItems]);
  const configItems = useMemo(() => navItems.filter((i) => i.key.startsWith("admin-")), [navItems]);

  const selectedKey = useMemo(() => {
    const match = navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.key;
  }, [navItems, pathname]);

  const activeLabel = useMemo(
    () => NAV_ITEMS.find((i) => i.key === selectedKey)?.label ?? "Dashboard",
    [selectedKey],
  );

  const now = dayjs();
  const monthProgress = Math.round((now.date() / now.daysInMonth()) * 100);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const menuBuilder = (items: typeof navItems) =>
    items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: <Link href={item.href}>{item.label}</Link>,
    }));

  return (
    <Layout className="min-h-screen !bg-surface-page">
      {isMobile && !collapsed && (
        <div
          aria-hidden
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-10 bg-black/40"
        />
      )}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
        width={228}
        className="!fixed !left-0 !top-0 !bottom-0 !z-20 !h-screen overflow-auto !border-r !border-border-subtle !bg-white"
      >
        <div className="h-16 flex items-center justify-center gap-2 font-heading font-bold text-lg text-text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-base text-white">
            🧭
          </span>
          {!collapsed && "HRIS"}
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={() => isMobile && setCollapsed(true)}
          className="!border-none px-2"
          items={menuBuilder(operationalItems)}
        />

        {configItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Konfigurasi
              </div>
            )}
            <Menu
              mode="inline"
              selectedKeys={selectedKey ? [selectedKey] : []}
              onClick={() => isMobile && setCollapsed(true)}
              className="!border-none px-2"
              items={menuBuilder(configItems)}
            />
          </>
        )}

        {!collapsed && (
          <div className="m-3 rounded-xl bg-surface-subtle p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-text-secondary">Periode Berjalan</span>
              <span className="text-xs font-semibold text-status-success">Aktif</span>
            </div>
            <p className="mb-2 font-heading text-sm font-semibold text-text-primary">
              {now.format("MMMM YYYY")}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full bg-primary-container"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
          </div>
        )}
      </Sider>

      <Layout
        className="relative isolate overflow-x-hidden !bg-transparent transition-all duration-200"
        style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 228 }}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-brand-blue-subtle via-surface-page to-accent-subtle"
        />
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none fixed top-[-6rem] right-[-6rem] -z-10 h-96 w-96 rounded-full bg-primary-container/10 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-float-slower pointer-events-none fixed bottom-[-8rem] left-[10%] -z-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />

        <Header className="!h-16 !bg-white/80 backdrop-blur-xl flex items-center justify-between gap-4 border-b border-border-subtle px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setCollapsed((c) => !c)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-text-secondary hover:bg-surface-subtle lg:hidden"
            >
              <MenuOutlined />
            </button>
            <div className="hidden items-center gap-1.5 truncate text-sm text-text-muted md:flex">
              <span>HRIS</span>
              <span>/</span>
              <span className="font-medium text-text-primary">{activeLabel}</span>
            </div>
            {SEARCH_ROLES.includes(user.role) && (
              <form
                className="relative hidden w-full max-w-xs xl:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
                  router.push(value ? `/employees?search=${encodeURIComponent(value)}` : "/employees");
                }}
              >
                <SearchOutlined className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  name="q"
                  placeholder="Cari karyawan, NIK..."
                  className="h-10 w-full rounded-lg bg-surface-subtle pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:bg-white focus:ring-2 focus:ring-primary-container/20"
                />
              </form>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/leave"
              className="hidden h-10 items-center gap-1.5 rounded-lg bg-surface-subtle px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-container sm:inline-flex"
            >
              <CalendarOutlined /> Ajukan Cuti
            </Link>
            <Link
              href="/attendance"
              className="hidden h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-medium text-white transition-colors hover:bg-brand-blue-hover sm:inline-flex"
            >
              <ClockCircleOutlined /> Absensi
            </Link>
            <div className="mx-1 hidden h-6 w-px bg-border-subtle sm:block" />
            <Dropdown
              menu={{
                items: [
                  { key: "logout", icon: <LogoutOutlined />, label: "Logout", onClick: () => logout() },
                ],
              }}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <div className="hidden leading-tight sm:block">
                  <div className="text-sm font-medium text-text-primary">{user.fullName}</div>
                  <Typography.Text type="secondary" className="!text-xs">
                    {roleLabel(user.role)}
                  </Typography.Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-4 pb-24 sm:p-6 lg:pb-6">{children}</Content>
      </Layout>

      <MobileTabBar user={user} onLogout={logout} />
    </Layout>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "EMPLOYEE":
      return "Karyawan";
    case "MANAGER":
      return "Manager";
    case "HR_ADMIN":
      return "HR Admin";
    case "SUPERADMIN":
      return "Superadmin";
    default:
      return role;
  }
}

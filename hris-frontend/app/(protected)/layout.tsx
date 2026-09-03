"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Dropdown, Layout, Menu, Spin, Typography } from "antd";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/auth-context";
import { navItemsForRole } from "@/lib/nav";

const { Header, Sider, Content } = Layout;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = useMemo(() => (user ? navItemsForRole(user.role) : []), [user]);

  const selectedKey = useMemo(() => {
    const match = navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.key;
  }, [navItems, pathname]);

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

  return (
    <Layout className="min-h-screen">
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
        theme="dark"
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
        className="!fixed !left-0 !top-0 !bottom-0 !z-20 !h-screen overflow-auto"
      >
        <div className="h-16 flex items-center justify-center gap-2 text-white font-semibold text-lg">
          <span className="text-xl">🧭</span>
          {!collapsed && "HRIS Modern"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={() => isMobile && setCollapsed(true)}
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.href}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout
        className="transition-all duration-200"
        style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 200 }}
      >
        <Header className="!bg-white flex items-center justify-between px-4 shadow-sm sm:px-6">
          <button
            type="button"
            aria-label="Buka menu"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"
          >
            <MenuOutlined />
          </button>
          <span className="hidden sm:block" />
          <Dropdown
            menu={{
              items: [
                { key: "logout", icon: <LogoutOutlined />, label: "Logout", onClick: () => logout() },
              ],
            }}
          >
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar icon={<UserOutlined />} />
              <div className="leading-tight">
                <div className="text-sm font-medium">{user.fullName}</div>
                <Typography.Text type="secondary" className="!text-xs">
                  {roleLabel(user.role)}
                </Typography.Text>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-zinc-50">{children}</Content>
      </Layout>
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

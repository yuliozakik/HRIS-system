"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer, Avatar } from "antd";
import { MoreOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { mobileNavForRole, type NavItem } from "@/lib/nav";
import type { CurrentUser } from "@/lib/types";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function TabButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
        active ? "text-primary-container" : "text-text-muted"
      }`}
    >
      <span className={`text-lg leading-none ${active ? "text-primary-container" : "text-text-muted"}`}>
        {item.icon}
      </span>
      <span className="max-w-[72px] truncate">{item.label}</span>
    </Link>
  );
}

export default function MobileTabBar({
  user,
  onLogout,
}: {
  user: CurrentUser;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { primary, rest } = useMemo(() => mobileNavForRole(user.role), [user.role]);
  const moreActive = rest.some((i) => isActive(pathname, i.href));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border-subtle bg-white/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigasi utama"
      >
        {primary.map((item) => (
          <TabButton key={item.key} item={item} active={isActive(pathname, item.href)} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
            moreActive ? "text-primary-container" : "text-text-muted"
          }`}
        >
          <MoreOutlined className="text-lg leading-none" />
          <span>Lainnya</span>
        </button>
      </nav>

      <Drawer
        placement="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        height="auto"
        closeIcon={null}
        title={null}
        className="lg:hidden"
        styles={{ body: { padding: 16 } }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" />
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-subtle p-3">
          <Avatar icon={<UserOutlined />} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-text-primary">{user.fullName}</div>
            <div className="text-xs text-text-muted">{user.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {rest.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-medium ${
                isActive(pathname, item.href)
                  ? "bg-brand-blue-subtle text-primary-container"
                  : "text-text-secondary hover:bg-surface-subtle"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="line-clamp-2">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              onLogout();
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-medium text-status-danger hover:bg-status-danger-subtle"
          >
            <LogoutOutlined className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </Drawer>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Search,
  Send,
  Settings,
  Truck,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { roleConfig, type AppRole } from "@/lib/role-config";

const ICON_MAP = {
  activity: Activity,
  building: Building2,
  check: CheckCircle2,
  inbox: Inbox,
  dashboard: LayoutDashboard,
  logout: LogOut,
  map: MapPin,
  package: Package,
  search: Search,
  send: Send,
  settings: Settings,
  truck: Truck,
  upload: Upload,
  users: Users,
  wallet: Wallet,
} as const;

export type ShellIcon = keyof typeof ICON_MAP;

export type ShellNavItem = {
  href: string;
  label: string;
  caption?: string;
  matchPrefix?: string;
  icon?: ShellIcon;
  section?: string;
};

type ShellAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary" | "ghost";
  icon?: ShellIcon;
};

function isActivePath(
  pathname: string,
  item: Pick<ShellNavItem, "href" | "matchPrefix">,
) {
  if (item.matchPrefix) {
    return pathname.startsWith(item.matchPrefix);
  }

  if (pathname === item.href) {
    return true;
  }

  if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return false;
}

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AppShell({
  role,
  title,
  userLabel,
  navItems,
  actions = [],
  children,
  topbarSlot,
}: {
  role: AppRole;
  title: string;
  userLabel?: string;
  navItems: ShellNavItem[];
  actions?: ShellAction[];
  children: ReactNode;
  topbarSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const activeItem = navItems
    .filter((item) => isActivePath(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const sections = groupNavBySection(navItems);

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div>
          <Link className="app-brand" href={roleConfig[role].homePath}>
            <span className="app-brand-mark">I</span>
            <span>
              <strong>Indek</strong>
              <span className="muted">COD ops platform</span>
            </span>
          </Link>

          <nav
            className="app-nav"
            aria-label={`${roleConfig[role].label} navigation`}
          >
            {sections.map(({ label, items }) => (
              <div className="app-nav-section" key={label ?? "default"}>
                {label ? (
                  <div className="app-nav-section-label">{label}</div>
                ) : null}
                {items.map((item) => {
                  const active = activeItem?.href === item.href;
                  const Icon = item.icon ? ICON_MAP[item.icon] : null;
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`app-nav-link ${active ? "active" : ""}`}
                      href={item.href}
                      key={item.href}
                    >
                      {Icon ? <Icon /> : <span />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div />

        {userLabel ? (
          <div className="app-sidebar-foot">
            <div className="user-row">
              <span className="app-user-chip-dot user-avatar">
                {initials(userLabel)}
              </span>
              <div>
                <div className="user-name">{userLabel}</div>
                <div className="user-role">{roleConfig[role].shortLabel}</div>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="app-frame">
        <header className="app-topbar">
          <div className="app-topbar-title">
            <h1>{activeItem?.label ?? title}</h1>
            {activeItem?.caption ? (
              <p className="app-topbar-caption">{activeItem.caption}</p>
            ) : null}
          </div>

          <div className="app-topbar-actions">
            {topbarSlot}
            {actions.map((action) => {
              const Icon = action.icon ? ICON_MAP[action.icon] : null;
              return (
                <Link
                  className={`button ${action.tone ?? "secondary"}`}
                  href={action.href}
                  key={`${action.href}:${action.label}`}
                >
                  {Icon ? (
                    <Icon style={{ width: 16, height: 16, marginRight: 6 }} />
                  ) : null}
                  {action.label}
                </Link>
              );
            })}
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </main>
  );
}

function groupNavBySection(items: ShellNavItem[]) {
  const groups = new Map<string | undefined, ShellNavItem[]>();
  for (const item of items) {
    const key = item.section;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

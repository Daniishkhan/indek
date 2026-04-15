"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { roleConfig, type AppRole } from "@/lib/role-config";

type ShellNavItem = {
  href: string;
  label: string;
  caption?: string;
  matchPrefix?: string;
};

type ShellAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

const FOOTER_COPY: Record<AppRole, { title: string; text: string }> = {
  operator: {
    title: "Control loop",
    text: "Use this surface to keep intake, dispatch, and live visibility on one system of record.",
  },
  merchant: {
    title: "Merchant view",
    text: "Track request flow, delivery outcomes, and remittance visibility from the same merchant workspace.",
  },
  rider: {
    title: "Field execution",
    text: "Accept assigned work, resolve delivery outcomes, and keep the operator view current in real time.",
  },
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

export function AppShell({
  role,
  title,
  description,
  userLabel,
  navItems,
  actions = [],
  children,
}: {
  role: AppRole;
  title: string;
  description: string;
  userLabel?: string;
  navItems: ShellNavItem[];
  actions?: ShellAction[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeItem =
    navItems.find((item) => isActivePath(pathname, item)) ?? navItems[0];
  const footer = FOOTER_COPY[role];

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <Link className="app-brand" href={roleConfig[role].homePath}>
            <span className="app-brand-mark">I</span>
            <span>
              <strong>Indek</strong>
              <span className="muted">COD-native ops</span>
            </span>
          </Link>

          <div className="app-role-card">
            <div className="split" style={{ alignItems: "center" }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>
                Shared shell
              </div>
              <span className="chip">{roleConfig[role].shortLabel}</span>
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <nav
          className="app-nav"
          aria-label={`${roleConfig[role].label} navigation`}
        >
          {navItems.map((item) => {
            const active = isActivePath(pathname, item);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`app-nav-link ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <span className="app-nav-label">{item.label}</span>
                {item.caption ? (
                  <span className="app-nav-caption">{item.caption}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-foot">
          <div className="label">{footer.title}</div>
          <p>{footer.text}</p>
        </div>
      </aside>

      <div className="app-frame">
        <header className="app-header">
          <div className="app-header-copy">
            <div className="eyebrow">{`${roleConfig[role].shortLabel} / ${activeItem?.label ?? title}`}</div>
            <div className="app-header-title">{title}</div>
            <p>{description}</p>
          </div>

          <div className="app-toolbar">
            {userLabel ? (
              <div className="app-user-chip">{userLabel}</div>
            ) : null}
            {actions.map((action) => (
              <Link
                className={`button ${action.tone === "secondary" ? "secondary" : ""}`}
                href={action.href}
                key={`${action.href}:${action.label}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </main>
  );
}

import Link from "next/link";

const links = [
  { href: "/operator", label: "Overview" },
  { href: "/operator/intake", label: "Intake" },
  { href: "/operator/dispatch", label: "Board" },
  { href: "/operator/live", label: "Live Ops" },
  { href: "/operator/reconciliation/r-umar", label: "Reconciliation" }
];

export default function OperatorLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="shell">
      <header className="panel topbar">
        <div>
          <div className="eyebrow">Operator console</div>
          <h1 style={{ margin: 0 }}>Indek control plane</h1>
        </div>
        <nav className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </main>
  );
}

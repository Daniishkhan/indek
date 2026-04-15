import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

const links = [
  { href: "/operator", label: "Overview" },
  { href: "/operator/intake", label: "Intake" },
  { href: "/operator/dispatch", label: "Board" },
  { href: "/operator/live", label: "Live Ops" },
  { href: "/operator/reconciliation/r-umar", label: "Reconciliation" }
];

export default async function OperatorLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in?next=/operator");
  const role = (session.user as { role?: string }).role;
  if (role !== "operator") {
    redirect(role === "rider" ? "/rider" : "/");
  }

  const name = session.user.name ?? session.user.email;

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
          <span style={{ padding: "10px 14px", color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
            {name}
          </span>
          <Link href="/sign-out">Sign out</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";

export default async function MerchantLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in/merchant?next=/merchant");

  const role = (session.user as { role?: string }).role;
  if (role !== "merchant") {
    redirect(getRoleHome(role));
  }

  const name = session.user.name ?? session.user.email;

  return (
    <main className="shell">
      <header className="panel topbar">
        <div>
          <div className="eyebrow">Merchant workspace</div>
          <h1 style={{ margin: 0 }}>Merchant visibility</h1>
        </div>
        <nav className="nav-links">
          <Link href="/merchant">Overview</Link>
          <span
            style={{
              padding: "10px 14px",
              color: "var(--muted-foreground)",
              fontSize: "0.85rem",
            }}
          >
            {name}
          </span>
          <Link href="/sign-out">Sign out</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}

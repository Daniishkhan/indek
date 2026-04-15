import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";

export default async function RiderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in/rider?next=/rider");
  const role = (session.user as { role?: string }).role;
  if (role !== "rider") {
    redirect(getRoleHome(role));
  }

  return (
    <main className="shell" style={{ width: "min(560px, calc(100vw - 20px))" }}>
      <header className="panel topbar">
        <div>
          <div className="eyebrow">Rider PWA</div>
          <h1 style={{ margin: 0 }}>Shift companion</h1>
        </div>
        <div className="nav-links">
          <Link href="/rider">Manifest</Link>
          <Link href="/sign-out">Sign out</Link>
        </div>
      </header>
      {children}
    </main>
  );
}

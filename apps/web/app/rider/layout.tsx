import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell } from "@/components/app-shell";

const links = [
  {
    href: "/rider",
    label: "Manifest",
    caption: "Accept assigned work and resolve delivery outcomes",
  },
];

export default async function RiderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in/rider?next=/rider");
  const role = (session.user as { role?: string }).role;
  if (role !== "rider") {
    redirect(getRoleHome(role));
  }

  const name = session.user.name ?? session.user.email;

  return (
    <AppShell
      actions={[
        { href: "/", label: "Site home", tone: "secondary" },
        { href: "/sign-out", label: "Sign out", tone: "secondary" },
      ]}
      description="Keep the field workflow simple: accept the manifest, complete deliveries, and push live status back to operations."
      navItems={links}
      role="rider"
      title="Rider shift workspace"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

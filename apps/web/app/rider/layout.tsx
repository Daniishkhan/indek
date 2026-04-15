import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell, type ShellNavItem } from "@/components/app-shell";

const links: ShellNavItem[] = [
  {
    href: "/rider",
    label: "Manifest",
    caption:
      "Accept your manifest, complete deliveries, and push status back to operations.",
    icon: "package",
    section: "Shift",
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
        { href: "/sign-out", label: "Sign out", tone: "ghost", icon: "logout" },
      ]}
      navItems={links}
      role="rider"
      title="Rider shift"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

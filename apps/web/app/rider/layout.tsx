import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell, type ShellNavItem } from "@/components/app-shell";

const links: ShellNavItem[] = [
  {
    href: "/rider",
    label: "My Work",
    caption: "Today's work and shift status",
    icon: "package",
    section: "Today",
  },
  {
    href: "/rider/deliveries",
    label: "Deliveries",
    caption: "Parcels to deliver now",
    icon: "truck",
    section: "Today",
  },
  {
    href: "/rider/done",
    label: "Done",
    caption: "Completed deliveries today",
    icon: "check",
    section: "Today",
  },
  {
    href: "/rider/cash",
    label: "Cash",
    caption: "Cash collected today",
    icon: "wallet",
    section: "Today",
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

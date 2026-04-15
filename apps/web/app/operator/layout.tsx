import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell, type ShellNavItem } from "@/components/app-shell";

const links: ShellNavItem[] = [
  {
    href: "/operator",
    label: "Overview",
    caption:
      "Today's delivery volume, COD exposure, and merchant activity at a glance.",
    icon: "dashboard",
    section: "Operations",
  },
  {
    href: "/operator/requests",
    label: "Requests",
    caption:
      "Capture new parcel requests from merchants when they come in by WhatsApp or phone.",
    icon: "inbox",
    section: "Operations",
  },
  {
    href: "/operator/dispatch",
    label: "Dispatch",
    caption:
      "Batch unassigned parcels by zone and assign them to a rider as a manifest.",
    icon: "truck",
    section: "Operations",
  },
  {
    href: "/operator/live",
    label: "Live ops",
    caption:
      "Monitor rider state, parcel custody, and cash exposure in real time.",
    icon: "activity",
    section: "Operations",
  },
  {
    href: "/operator/merchants",
    label: "Merchants",
    caption:
      "Manage the merchant roster, fees and proof rules, and their request portal links.",
    icon: "building",
    section: "Roster",
  },
  {
    href: "/operator/riders",
    label: "Riders",
    caption: "Manage the rider roster, shift status, and cash reconciliation.",
    icon: "users",
    section: "Roster",
  },
];

export default async function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in/operator?next=/operator");
  const role = (session.user as { role?: string }).role;
  if (role !== "operator") {
    redirect(getRoleHome(role));
  }

  const name = session.user.name ?? session.user.email;

  return (
    <AppShell
      actions={[
        { href: "/sign-out", label: "Sign out", tone: "ghost", icon: "logout" },
      ]}
      navItems={links}
      role="operator"
      title="Operator control plane"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

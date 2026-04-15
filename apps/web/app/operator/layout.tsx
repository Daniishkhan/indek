import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell } from "@/components/app-shell";

const links = [
  {
    href: "/operator",
    label: "Overview",
    caption: "Snapshot, recent requests, and queue pressure",
  },
  {
    href: "/operator/intake",
    label: "Intake",
    caption: "Create merchants, riders, and manual orders",
  },
  {
    href: "/operator/dispatch",
    label: "Dispatch",
    caption: "Assign unassigned requests into rider manifests",
  },
  {
    href: "/operator/live",
    label: "Live ops",
    caption: "Watch rider load and cash exposure",
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
        { href: "/", label: "Site home", tone: "secondary" },
        { href: "/sign-out", label: "Sign out", tone: "secondary" },
      ]}
      description="Run the merchant request loop, dispatch riders, and monitor live COD operations from one control surface."
      navItems={links}
      role="operator"
      title="Operator control plane"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

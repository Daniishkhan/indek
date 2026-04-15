import { redirect } from "next/navigation";
import { getMerchantForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell, type ShellNavItem } from "@/components/app-shell";

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
  const merchant = await getMerchantForUser(session.user.id);
  const navItems: ShellNavItem[] = [
    {
      href: "/merchant",
      label: "Overview",
      caption:
        "Track parcel flow, delivery outcomes, and remittance visibility.",
      icon: "dashboard",
      section: "Workspace",
    },
    ...(merchant
      ? [
          {
            href: `/m/${merchant.token}`,
            label: "Request portal",
            caption: "Submit a new delivery request without operator re-entry.",
            icon: "send",
            matchPrefix: "/m/",
            section: "Workspace",
          } satisfies ShellNavItem,
        ]
      : []),
  ];

  return (
    <AppShell
      actions={[
        { href: "/sign-out", label: "Sign out", tone: "ghost", icon: "logout" },
      ]}
      navItems={navItems}
      role="merchant"
      title="Merchant workspace"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

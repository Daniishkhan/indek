import { redirect } from "next/navigation";
import { getMerchantForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { AppShell } from "@/components/app-shell";

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
  const navItems = [
    {
      href: "/merchant",
      label: "Overview",
      caption: "Status visibility and remittance summary",
    },
    ...(merchant
      ? [
          {
            href: `/m/${merchant.token}`,
            label: "Request portal",
            caption: "Open the bare MVP order entry surface",
            matchPrefix: "/m/",
          },
        ]
      : []),
  ];

  return (
    <AppShell
      actions={[
        { href: "/", label: "Site home", tone: "secondary" },
        { href: "/sign-out", label: "Sign out", tone: "secondary" },
      ]}
      description="Follow parcel status, see delivered and failed outcomes, and keep merchant-facing visibility on the same request loop."
      navItems={navItems}
      role="merchant"
      title="Merchant workspace"
      userLabel={name}
    >
      {children}
    </AppShell>
  );
}

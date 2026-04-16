import { getMerchantPortalData } from "@indek/domain";
import { notFound } from "next/navigation";
import {
  createBulkParcelsAction,
  createMerchantParcelAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { BulkUploadForm } from "@/components/bulk-upload-form";
import { MerchantRequestForm } from "@/components/merchant-request-form";
import { getCurrentSession } from "@/lib/session";
import {
  getMerchantNavItems,
  getPublicPortalNavItems,
} from "@/lib/merchant-nav";

export const dynamic = "force-dynamic";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "order-submitted": {
      tone: "success",
      text: "Delivery request submitted. Ops will review it before dispatch.",
    },
    "bulk-uploaded": {
      tone: "success",
      text: "Bulk upload complete. Your orders are now under ops review.",
    },
    "bulk-upload-failed": {
      tone: "warn",
      text: "Bulk upload failed. Check your CSV and try again.",
    },
  };

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ token }, { notice: noticeCode }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [portal, session] = await Promise.all([
    getMerchantPortalData(token),
    getCurrentSession(),
  ]);

  if (!portal) {
    notFound();
  }

  const { merchant } = portal;
  const notice = noticeCode ? NOTICE_COPY[noticeCode] : undefined;
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const userLabel =
    sessionRole === "merchant"
      ? (session?.user.name ?? session?.user.email ?? undefined)
      : undefined;
  const actions =
    sessionRole === "merchant"
      ? [
          { href: "/merchant", label: "Workspace", tone: "secondary" as const },
          { href: "/sign-out", label: "Sign out", tone: "secondary" as const },
        ]
      : [
          {
            href: "/sign-in/merchant",
            label: "Merchant sign in",
            tone: "secondary" as const,
          },
          { href: "/", label: "Site home", tone: "secondary" as const },
        ];

  return (
    <AppShell
      actions={actions}
      navItems={
        sessionRole === "merchant"
          ? getMerchantNavItems(merchant.token)
          : getPublicPortalNavItems(merchant.token)
      }
      role="merchant"
      title={`${merchant.name} portal`}
      userLabel={userLabel}
    >
      <section
        className="panel"
        style={{ display: "flex", alignItems: "center", gap: 20 }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-md)",
            background: "var(--primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {merchant.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Create orders</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
            Submit a single delivery request or upload a CSV to create multiple
            orders at once.
          </p>
        </div>
      </section>

      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Single order</div>
            <h2 style={{ margin: 0 }}>Create a delivery request</h2>
            <p>
              Fill in the pickup and delivery details. Ops reviews every request
              before dispatching a rider.
            </p>
          </div>

          <MerchantRequestForm
            action={createMerchantParcelAction}
            merchant={merchant}
          />
        </article>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Bulk upload</div>
            <h2 style={{ margin: 0 }}>Import orders from CSV</h2>
            <p>
              Upload a spreadsheet with multiple orders. Preview and confirm
              before submitting.
            </p>
          </div>

          <BulkUploadForm
            action={createBulkParcelsAction}
            merchant={merchant}
          />
        </aside>
      </section>
    </AppShell>
  );
}

import { getMerchantPortalData } from "@indek/domain";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Inbox, Package } from "lucide-react";
import { updateMerchantFulfillmentAction } from "@/app/actions";
import { FulfillmentSetup } from "@/components/fulfillment-setup";
import { AppShell } from "@/components/app-shell";
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
    "request-updated": {
      tone: "success",
      text: "Request updated and re-sent to ops for review.",
    },
    "request-update-failed": {
      tone: "warn",
      text: "That update could not be saved. Refresh and try again.",
    },
    "bulk-uploaded": {
      tone: "success",
      text: "Bulk upload complete. Your orders are now under ops review.",
    },
    "bulk-upload-failed": {
      tone: "warn",
      text: "Bulk upload failed. Check your CSV and try again.",
    },
    "fulfillment-saved": {
      tone: "success",
      text: "Fulfillment setup updated.",
    },
    "pickup-missing": {
      tone: "warn",
      text: "Pickup address is required when using rider pickup.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function MerchantPage({
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

  const { merchant, remittance, summary } = portal;
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
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>{merchant.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
            Place a delivery request and track its progress. Ops reviews every
            request before dispatch.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Under review</span>
            <span className="kpi-icon amber">
              <Clock />
            </span>
          </div>
          <div className="kpi-value">{summary.underReviewCount}</div>
          <div className="kpi-foot">
            <span>Ops is checking these now</span>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Needs your input</span>
            <span className="kpi-icon">
              <Inbox />
            </span>
          </div>
          <div className="kpi-value">{summary.needsClarificationCount}</div>
          <div className="kpi-foot">
            <span>Update below and ops will re-review</span>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Awaiting dispatch</span>
            <span className="kpi-icon success">
              <CheckCircle2 />
            </span>
          </div>
          <div className="kpi-value">{summary.awaitingAssignmentCount}</div>
          <div className="kpi-foot">
            <span>Approved, waiting for a rider</span>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Active parcels</span>
            <span className="kpi-icon cyan">
              <Package />
            </span>
          </div>
          <div className="kpi-value">{summary.activeCount}</div>
          <div className="kpi-foot">
            <span>Moving through the field</span>
          </div>
        </article>
      </section>

      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Fulfillment</div>
            <h2>How do parcels reach the rider?</h2>
            <p>
              Choose whether a rider picks up from your location, or you drop
              parcels off at our hub.
            </p>
          </div>

          <FulfillmentSetup
            action={updateMerchantFulfillmentAction}
            merchant={merchant}
          />
        </article>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Current cycle</div>
            <h2>Visibility snapshot</h2>
          </div>

          <div className="list">
            <div className="list-item">
              <div className="label">Default proof</div>
              <div className="value">{merchant.proofRequirement}</div>
            </div>
            <div className="list-item">
              <div className="label">Remittance cycle</div>
              <div className="value">{merchant.remittanceCycle}</div>
            </div>
            <div className="list-item">
              <div className="label">Delivery fee</div>
              <div className="value">
                {formatCurrency(merchant.deliveryFeeAed)}
              </div>
            </div>
          </div>

          {remittance ? (
            <div className="list">
              <div className="list-item">
                <div className="label">Open cycle statement</div>
                <div className="value">{remittance.cycleLabel}</div>
              </div>
              <div className="list-item">
                <div className="label">Net payable</div>
                <div className="metric-value">
                  {formatCurrency(remittance.netPayableAed)}
                </div>
              </div>
              <div className="list-item">
                <div className="label">VAT on fees</div>
                <div className="value">{formatCurrency(remittance.vatAed)}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No delivered parcels yet.</strong>
              <span className="muted">
                Once delivery starts happening, fee and remittance visibility
                appears here automatically.
              </span>
            </div>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

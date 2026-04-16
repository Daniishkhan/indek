import { getMerchantPortalData } from "@indek/domain";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/session";
import {
  getMerchantNavItems,
  getPublicPortalNavItems,
} from "@/lib/merchant-nav";
import { FinanceOverview } from "@/components/finance-overview";

export const dynamic = "force-dynamic";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function FinancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [portal, session] = await Promise.all([
    getMerchantPortalData(token),
    getCurrentSession(),
  ]);

  if (!portal) {
    notFound();
  }

  const { merchant, parcels, remittance } = portal;
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

  // Build a lookup of remittance lines by parcelId for delivered parcels
  const remittanceByParcel = new Map(
    (remittance?.lines ?? []).map((line) => [line.parcelId, line]),
  );

  // Compute per-parcel financial data
  const financeParcels = parcels.map((parcel) => {
    const line = remittanceByParcel.get(parcel.id);
    const isDelivered = parcel.state === "delivered";
    const isFailed = parcel.state === "failed";
    const financialState: "collected" | "pending" | "failed" = isDelivered
      ? "collected"
      : isFailed
        ? "failed"
        : "pending";

    const deliveryFeeAed = line ? line.deliveryFeeAed : 0;
    const handlingFeeAed = line
      ? line.handlingFeeAed
      : isDelivered
        ? roundCurrency(parcel.codAmountAed * merchant.codFeePercent)
        : 0;
    const totalFeeAed = deliveryFeeAed + handlingFeeAed;
    const netAed = isDelivered
      ? roundCurrency(parcel.codAmountAed - totalFeeAed)
      : 0;

    return {
      id: parcel.id,
      awb: parcel.awb,
      customerName: parcel.customerName,
      customerPhone: parcel.customerPhone,
      area: parcel.area,
      codAmountAed: parcel.codAmountAed,
      state: parcel.state,
      financialState,
      deliveryFeeAed,
      handlingFeeAed,
      netAed,
      lastUpdateAt: parcel.lastUpdateAt,
    };
  });

  // Compute aggregate KPIs
  const grossCod = parcels
    .filter((p) => p.state === "delivered")
    .reduce((sum, p) => sum + p.codAmountAed, 0);

  const pendingCod = parcels
    .filter((p) => p.state === "assigned" || p.state === "in_transit")
    .reduce((sum, p) => sum + p.codAmountAed, 0);

  const totalFees = remittance
    ? remittance.lines.reduce(
        (sum, l) => sum + l.deliveryFeeAed + l.handlingFeeAed,
        0,
      )
    : 0;

  const vatAed = remittance?.vatAed ?? 0;
  const netPayable = remittance?.netPayableAed ?? 0;

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
      {parcels.length === 0 ? (
        <section
          className="panel stack"
          style={{ textAlign: "center", padding: "48px 24px" }}
        >
          <div>
            <div className="eyebrow">Finance</div>
            <h2 style={{ margin: "8px 0 0" }}>No financial activity yet</h2>
            <p style={{ maxWidth: 520, margin: "8px auto 0" }}>
              Once you start placing delivery orders, your financial overview
              will appear here — COD tracking, fee breakdowns, and downloadable
              statements.
            </p>
          </div>
          <div style={{ marginTop: 8 }}>
            <Link className="button" href={`/m/${merchant.token}/orders`}>
              <ExternalLink style={{ width: 14, height: 14, marginRight: 6 }} />
              Create your first order
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <article className="kpi">
              <div className="kpi-head">
                <span className="kpi-label">Net payable</span>
                <span className="kpi-icon success">
                  <Wallet />
                </span>
              </div>
              <div className="kpi-value">{formatCurrency(netPayable)}</div>
              <div className="kpi-foot">
                <span>After fees &amp; VAT</span>
              </div>
            </article>

            <article className="kpi">
              <div className="kpi-head">
                <span className="kpi-label">COD collected</span>
                <span className="kpi-icon cyan">
                  <CheckCircle2 />
                </span>
              </div>
              <div className="kpi-value">{formatCurrency(grossCod)}</div>
              <div className="kpi-foot">
                <span>From delivered orders</span>
              </div>
            </article>

            <article className="kpi">
              <div className="kpi-head">
                <span className="kpi-label">Pending collection</span>
                <span className="kpi-icon amber">
                  <Clock />
                </span>
              </div>
              <div className="kpi-value">{formatCurrency(pendingCod)}</div>
              <div className="kpi-foot">
                <span>Orders in transit</span>
              </div>
            </article>

            <article className="kpi">
              <div className="kpi-head">
                <span className="kpi-label">Fees &amp; VAT</span>
                <span className="kpi-icon">
                  <Activity />
                </span>
              </div>
              <div className="kpi-value">
                {formatCurrency(totalFees + vatAed)}
              </div>
              <div className="kpi-foot">
                <span>Delivery + handling + {formatCurrency(vatAed)} VAT</span>
              </div>
            </article>
          </section>

          <section className="grid">
            <FinanceOverview
              merchantName={merchant.name}
              parcels={financeParcels}
            />

            <aside className="panel stack">
              <div>
                <div className="eyebrow">Your rates</div>
                <h2 style={{ margin: 0 }}>Fee structure</h2>
              </div>

              <div className="list">
                <div className="list-item">
                  <div className="split">
                    <span className="label">Delivery fee</span>
                    <span className="value">Per order</span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    Set by ops during review
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">COD handling</span>
                    <span className="value">
                      {(merchant.codFeePercent * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">VAT on fees</span>
                    <span className="value">5%</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">Remittance cycle</span>
                    <span className="value">{merchant.remittanceCycle}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">Dispute window</span>
                    <span className="value">
                      {merchant.disputeWindowDays} days
                    </span>
                  </div>
                </div>
              </div>

              {remittance ? (
                <div className="estimate-card">
                  <div className="label">Cycle · {remittance.cycleLabel}</div>
                  <div className="metric-value">
                    {formatCurrency(remittance.netPayableAed)}
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    Gross {formatCurrency(grossCod)} · VAT{" "}
                    {formatCurrency(vatAed)}
                  </div>
                </div>
              ) : null}
            </aside>
          </section>
        </>
      )}
    </AppShell>
  );
}

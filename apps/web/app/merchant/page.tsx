import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  Wallet,
} from "lucide-react";
import { getMerchantPortalDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";
import { BarCategoryChart, DonutChart, chartColors } from "@/components/charts";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function formatCurrencyCompact(value: number) {
  if (value >= 1000) {
    return `AED ${(value / 1000).toFixed(1)}k`;
  }
  return `AED ${Math.round(value)}`;
}

export default async function MerchantHomePage() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const portal = await getMerchantPortalDataForUser(session.user.id);

  if (!portal) {
    return (
      <section className="panel">
        <div className="eyebrow">Merchant workspace</div>
        <h2>No merchant profile is linked yet</h2>
        <p>
          This account can sign in on the merchant route, but it is not linked
          to a merchant record in Indek yet.
        </p>
      </section>
    );
  }

  const { merchant, parcels, remittance, summary } = portal;

  const stateBreakdown = [
    {
      label: "Awaiting",
      value: summary.awaitingAssignmentCount,
      color: chartColors[3],
    },
    {
      label: "Active",
      value: summary.activeCount,
      color: chartColors[1],
    },
    {
      label: "Delivered",
      value: summary.deliveredCount,
      color: chartColors[2],
    },
    {
      label: "Failed",
      value: summary.failedCount,
      color: chartColors[4],
    },
  ].filter((entry) => entry.value > 0);

  const totalCod = parcels.reduce((sum, p) => sum + p.codAmountAed, 0);
  const deliveredCod = parcels
    .filter((p) => p.state === "delivered")
    .reduce((sum, p) => sum + p.codAmountAed, 0);

  const remittanceChart =
    remittance && remittance.lines.length > 0
      ? remittance.lines.slice(0, 8).map((line) => ({
          label: line.awb.slice(-6),
          cod: line.codAed,
          fees: line.deliveryFeeAed + line.handlingFeeAed,
        }))
      : [];

  return (
    <>
      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Awaiting assignment</span>
            <span className="kpi-icon amber">
              <Clock />
            </span>
          </div>
          <div className="kpi-value">{summary.awaitingAssignmentCount}</div>
          <div className="kpi-foot">
            <span>Requests waiting for dispatch</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Active parcels</span>
            <span className="kpi-icon">
              <Package />
            </span>
          </div>
          <div className="kpi-value">{summary.activeCount}</div>
          <div className="kpi-foot">
            <span>Out with riders or in exception</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Delivered</span>
            <span className="kpi-icon success">
              <CheckCircle2 />
            </span>
          </div>
          <div className="kpi-value">{summary.deliveredCount}</div>
          <div className="kpi-foot">
            <span>{formatCurrencyCompact(deliveredCod)} COD collected</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Open remittance</span>
            <span className="kpi-icon cyan">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">
            {remittance
              ? formatCurrencyCompact(remittance.netPayableAed)
              : "AED 0"}
          </div>
          <div className="kpi-foot">
            <span>Net payable after fees</span>
          </div>
        </article>
      </section>

      <section className="grid">
        <div className="chart-panel">
          <div className="chart-head">
            <div>
              <div className="eyebrow">Status funnel</div>
              <h3>Parcel pipeline</h3>
            </div>
            <span className="chip">{parcels.length} total</span>
          </div>
          {stateBreakdown.length > 0 ? (
            <DonutChart data={stateBreakdown} />
          ) : (
            <div className="empty-state">
              <span className="muted">No parcels yet.</span>
            </div>
          )}
        </div>

        <div className="chart-panel">
          <div className="chart-head">
            <div>
              <div className="eyebrow">
                Cycle: {remittance?.cycleLabel ?? "—"}
              </div>
              <h3>COD vs. fees per parcel</h3>
            </div>
            <span className="chip primary">
              {remittance ? formatCurrency(remittance.netPayableAed) : "AED 0"}
            </span>
          </div>
          {remittanceChart.length > 0 ? (
            <BarCategoryChart
              data={remittanceChart}
              dataKey="cod"
              color={chartColors[2]}
              valueFormat="currency-compact"
              height={240}
            />
          ) : (
            <div className="empty-state">
              <strong>No delivered parcels yet.</strong>
              <span className="muted">
                Delivered work will roll into the remittance summary here.
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="grid">
        <div className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Current parcels</div>
              <h2 style={{ margin: 0 }}>{merchant.name} · status visibility</h2>
            </div>
            <Link className="button secondary" href={`/m/${merchant.token}`}>
              <ExternalLink style={{ width: 14, height: 14, marginRight: 6 }} />
              Open request portal
            </Link>
          </div>

          {parcels.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>AWB</th>
                  <th>Customer</th>
                  <th>State</th>
                  <th>Updated</th>
                  <th style={{ textAlign: "right" }}>COD</th>
                </tr>
              </thead>
              <tbody>
                {parcels.slice(0, 10).map((parcel) => (
                  <tr key={parcel.id}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {parcel.awb}
                    </td>
                    <td>{parcel.customerName}</td>
                    <td>
                      <span
                        className={`status-dot ${
                          parcel.state === "delivered"
                            ? "success"
                            : parcel.state === "failed"
                              ? "danger"
                              : parcel.state === "in_transit"
                                ? "primary"
                                : "warn"
                        }`}
                      >
                        {parcel.state.replace("_", " ")}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: "0.82rem" }}>
                      {new Date(parcel.lastUpdateAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCurrency(parcel.codAmountAed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No parcel activity yet.</strong>
              <span className="muted">
                Use the request portal to create the first order.
              </span>
            </div>
          )}
        </div>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Remittance</div>
            <h2 style={{ margin: 0 }}>Fee visibility</h2>
          </div>

          {remittance ? (
            <>
              <div className="estimate-card">
                <div className="label">
                  Net payable · {remittance.cycleLabel}
                </div>
                <div className="metric-value">
                  {formatCurrency(remittance.netPayableAed)}
                </div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  VAT {formatCurrency(remittance.vatAed)} · Held{" "}
                  {formatCurrency(remittance.heldAmountAed)}
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <div className="split">
                    <span className="label">Proof requirement</span>
                    <span className="value">{merchant.proofRequirement}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">Cycle</span>
                    <span className="value">{merchant.remittanceCycle}</span>
                  </div>
                </div>
                <div className="list-item">
                  <div className="split">
                    <span className="label">Gross COD</span>
                    <span className="value">{formatCurrency(totalCod)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>No delivered parcels yet.</strong>
              <span className="muted">
                Delivered work will roll into the remittance summary here.
              </span>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

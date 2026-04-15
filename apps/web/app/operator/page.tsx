import Link from "next/link";
import { AlertCircle, Building2, Package, Truck, Wallet } from "lucide-react";
import { getOperatorOverviewData, listParcels } from "@indek/domain";
import {
  AreaTrendChart,
  BarCategoryChart,
  DonutChart,
  chartColors,
} from "@/components/charts";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function formatCurrencyCompact(value: number) {
  if (value >= 1000) {
    return `AED ${(value / 1000).toFixed(1)}k`;
  }
  return `AED ${Math.round(value)}`;
}

function buildDailyTrend(
  parcels: Array<{ lastUpdateAt: string; codAmountAed: number }>,
) {
  const now = new Date();
  const days: Array<{ label: string; parcels: number; cod: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const parcelsForDay = parcels.filter(
      (p) => p.lastUpdateAt.slice(0, 10) === key,
    );
    days.push({
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      parcels: parcelsForDay.length,
      cod: parcelsForDay.reduce((sum, p) => sum + p.codAmountAed, 0),
    });
  }
  return days;
}

export default async function OperatorOverviewPage() {
  const [
    { manifests, merchants, recentParcels, riders, snapshot, unassigned },
    allParcels,
  ] = await Promise.all([getOperatorOverviewData(), listParcels()]);

  const newestRequest = unassigned[0];
  const trend = buildDailyTrend(allParcels);

  const stateBreakdown = [
    {
      label: "Unassigned",
      value: allParcels.filter((p) => p.state === "unassigned").length,
      color: chartColors[3],
    },
    {
      label: "Assigned",
      value: allParcels.filter((p) => p.state === "assigned").length,
      color: chartColors[5],
    },
    {
      label: "In transit",
      value: allParcels.filter((p) => p.state === "in_transit").length,
      color: chartColors[1],
    },
    {
      label: "Delivered",
      value: allParcels.filter((p) => p.state === "delivered").length,
      color: chartColors[2],
    },
    {
      label: "Failed",
      value: allParcels.filter((p) => p.state === "failed").length,
      color: chartColors[4],
    },
  ].filter((entry) => entry.value > 0);

  const riderLoad = riders
    .map((rider) => ({
      label: rider.name.split(" ")[0] ?? rider.name,
      parcels: rider.parcelsInCustody,
      cash: rider.cashHeldAed,
    }))
    .sort((a, b) => b.parcels - a.parcels)
    .slice(0, 6);

  const codSpark = trend.map((d) => d.cod);

  return (
    <>
      {unassigned.length > 0 ? (
        <section className="notice warn workflow-alert">
          <div className="stack-tight">
            <div className="label">New delivery request</div>
            <strong>
              {unassigned.length} delivery
              {unassigned.length === 1 ? "" : "ies"} waiting for assignment
            </strong>
            <span className="muted">
              {newestRequest?.customerName} from{" "}
              {newestRequest?.merchantName ?? "Merchant"} just landed in the
              unassigned queue.
            </span>
          </div>
          <Link className="button secondary" href="/operator/dispatch">
            Open dispatch board
          </Link>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Active deliveries</span>
            <span className="kpi-icon">
              <Truck />
            </span>
          </div>
          <div className="kpi-value">{snapshot.activeDeliveries}</div>
          <div className="kpi-foot">
            <span>{snapshot.activeManifests} open manifests</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Unassigned queue</span>
            <span className="kpi-icon amber">
              <AlertCircle />
            </span>
          </div>
          <div className="kpi-value">{snapshot.unassigned}</div>
          <div className="kpi-foot">
            <span>Waiting for dispatch</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">COD exposure</span>
            <span className="kpi-icon success">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">
            {formatCurrencyCompact(snapshot.codExposureAed)}
          </div>
          <div className="kpi-foot">
            <span>Cash currently with riders</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Merchants</span>
            <span className="kpi-icon cyan">
              <Building2 />
            </span>
          </div>
          <div className="kpi-value">{snapshot.merchantCount}</div>
          <div className="kpi-foot">
            <span>{snapshot.riderCount} riders on roster</span>
          </div>
        </article>
      </section>

      <section className="grid">
        <div className="chart-panel">
          <div className="chart-head">
            <div>
              <div className="eyebrow">Last 7 days</div>
              <h3>COD volume handled</h3>
            </div>
            <span className="chip primary">
              {formatCurrency(codSpark.reduce((s, v) => s + v, 0))}
            </span>
          </div>
          <AreaTrendChart
            data={trend}
            dataKey="cod"
            label="COD"
            color={chartColors[0]}
            valueFormat="currency-compact"
          />
        </div>

        <div className="chart-panel">
          <div className="chart-head">
            <div>
              <div className="eyebrow">Pipeline</div>
              <h3>Parcels by state</h3>
            </div>
            <span className="chip">{allParcels.length} total</span>
          </div>
          {stateBreakdown.length > 0 ? (
            <DonutChart data={stateBreakdown} />
          ) : (
            <div className="empty-state">
              <span className="muted">No parcels yet.</span>
            </div>
          )}
        </div>
      </section>

      <section className="grid">
        <div className="chart-panel">
          <div className="chart-head">
            <div>
              <div className="eyebrow">Fleet pressure</div>
              <h3>Parcels in rider custody</h3>
            </div>
            <span className="chip">{riders.length} riders</span>
          </div>
          {riderLoad.length > 0 ? (
            <BarCategoryChart
              data={riderLoad}
              dataKey="parcels"
              horizontal
              color={chartColors[5]}
              height={Math.max(220, riderLoad.length * 40)}
            />
          ) : (
            <div className="empty-state">
              <span className="muted">No riders in custody right now.</span>
            </div>
          )}
        </div>

        <aside className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Needs action</div>
              <h2 style={{ margin: 0 }}>Dispatch queue</h2>
            </div>
            <span className="chip warn">{unassigned.length}</span>
          </div>

          {unassigned.length > 0 ? (
            <div className="list">
              {unassigned.slice(0, 4).map((parcel) => (
                <div className="list-item" key={parcel.id}>
                  <div className="split">
                    <strong>{parcel.awb}</strong>
                    <span className="chip warn">
                      {formatCurrency(parcel.codAmountAed)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem" }}>
                    {parcel.customerName}
                  </div>
                  <div className="muted">
                    {parcel.merchantName ?? "Merchant"} · {parcel.area}
                  </div>
                </div>
              ))}
              <Link
                className="button secondary"
                href="/operator/dispatch"
                style={{ justifySelf: "stretch" }}
              >
                Open dispatch board
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <strong>All clear.</strong>
              <span className="muted">
                New requests will surface here immediately.
              </span>
            </div>
          )}
        </aside>
      </section>

      <section className="grid">
        <div className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Recent requests</div>
              <h2 style={{ margin: 0 }}>Latest parcels</h2>
            </div>
            <span className="chip">{recentParcels.length}</span>
          </div>

          {recentParcels.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>AWB</th>
                  <th>Merchant</th>
                  <th>Customer</th>
                  <th>State</th>
                  <th style={{ textAlign: "right" }}>COD</th>
                </tr>
              </thead>
              <tbody>
                {recentParcels.slice(0, 8).map((parcel) => (
                  <tr key={parcel.id}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {parcel.awb}
                    </td>
                    <td>{parcel.merchantName ?? "Merchant"}</td>
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
              <strong>No parcel requests yet.</strong>
              <span className="muted">
                Create a merchant and submit the first order from the requests
                desk.
              </span>
            </div>
          )}
        </div>

        <aside className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Merchant portals</div>
              <h2 style={{ margin: 0 }}>Request links</h2>
            </div>
            <span className="chip">{merchants.length}</span>
          </div>

          {merchants.length > 0 ? (
            <div className="list">
              {merchants.slice(0, 6).map((merchant) => (
                <Link
                  className="list-item interactive-card"
                  key={merchant.id}
                  href={`/m/${merchant.token}`}
                >
                  <div className="split">
                    <strong>{merchant.name}</strong>
                    <span className="chip">{merchant.remittanceCycle}</span>
                  </div>
                  <span className="muted" style={{ fontSize: "0.82rem" }}>
                    Tokenized merchant portal
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No merchants yet.</strong>
              <span className="muted">
                Create the first one from the merchants page.
              </span>
            </div>
          )}

          <div className="muted" style={{ fontSize: "0.82rem" }}>
            {manifests.length} manifest{manifests.length === 1 ? "" : "s"} open
          </div>
        </aside>
      </section>
    </>
  );
}

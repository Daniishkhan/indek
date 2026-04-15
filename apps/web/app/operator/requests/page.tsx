import Link from "next/link";
import { ArrowRight, Inbox, Package, Wallet } from "lucide-react";
import { getOperatorIntakeData } from "@indek/domain";
import { createOperatorParcelAction } from "@/app/actions";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "order-created": {
      tone: "success",
      text: "Parcel request created and added to the unassigned queue.",
    },
    "order-missing-merchant": {
      tone: "warn",
      text: "Pick a merchant before creating a parcel request.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function formatCurrencyCompact(value: number) {
  if (value >= 1000) return `AED ${(value / 1000).toFixed(1)}k`;
  return `AED ${Math.round(value)}`;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ merchants, queue, recentParcels }, params] = await Promise.all([
    getOperatorIntakeData(),
    searchParams,
  ]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  const queueCod = queue.reduce((sum, p) => sum + p.codAmountAed, 0);
  const today = new Date();
  const todayRequests = recentParcels.filter((p) => {
    const created = new Date(p.createdAt ?? p.lastUpdateAt);
    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  }).length;

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Unassigned queue</span>
            <span className="kpi-icon amber">
              <Inbox />
            </span>
          </div>
          <div className="kpi-value">{queue.length}</div>
          <div className="kpi-foot">
            <span>Waiting for dispatch</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">COD in queue</span>
            <span className="kpi-icon cyan">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">{formatCurrencyCompact(queueCod)}</div>
          <div className="kpi-foot">
            <span>Pending collection</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Captured today</span>
            <span className="kpi-icon success">
              <Package />
            </span>
          </div>
          <div className="kpi-value">{todayRequests}</div>
          <div className="kpi-foot">
            <span>New requests logged</span>
          </div>
        </article>
      </section>

      {merchants.length === 0 ? (
        <div className="empty-state">
          <strong>Requests need at least one merchant.</strong>
          <span className="muted">
            Every parcel request belongs to a merchant. Create one before
            capturing orders.
          </span>
          <Link
            className="button"
            href="/operator/merchants"
            style={{ marginTop: 12, width: "fit-content" }}
          >
            Go to merchants
            <ArrowRight style={{ width: 14, height: 14, marginLeft: 6 }} />
          </Link>
        </div>
      ) : (
        <section className="grid">
          <article className="panel stack">
            <div>
              <div className="eyebrow">Log a request</div>
              <h2 style={{ margin: 0 }}>Capture a new parcel</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                Use this when a merchant sends a WhatsApp message, phone order,
                or spreadsheet row. The request will land on the dispatch board
                immediately.
              </p>
            </div>

            <form action={createOperatorParcelAction}>
              <div className="form-section">
                <div className="form-section-head">
                  <span className="section-title">1 · Merchant & item</span>
                  <span className="section-hint">
                    Who is this for, and what are we delivering?
                  </span>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label">Merchant</span>
                    <select className="select" name="merchantId" required>
                      <option value="">Select merchant</option>
                      {merchants.map((merchant) => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span className="label">Item summary</span>
                    <input
                      className="input"
                      name="itemSummary"
                      placeholder="Abaya set"
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span className="label">COD amount (AED)</span>
                    <input
                      className="input"
                      defaultValue="0"
                      min="0"
                      name="codAmountAed"
                      step="0.01"
                      type="number"
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <span className="section-title">2 · Customer</span>
                  <span className="section-hint">
                    Who is receiving the parcel?
                  </span>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label">Customer name</span>
                    <input
                      className="input"
                      name="customerName"
                      placeholder="Rania Tariq"
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span className="label">Phone</span>
                    <input
                      className="input"
                      name="customerPhone"
                      placeholder="+971 52 300 9011"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <span className="section-title">3 · Pickup</span>
                  <span className="section-hint">
                    Where the rider collects the parcel.
                  </span>
                </div>
                <label className="form-field">
                  <span className="label">Pickup address</span>
                  <textarea
                    className="textarea"
                    name="pickupAddress"
                    placeholder="Bloom Boutique, Al Quoz industrial area 3, warehouse gate 2"
                    required
                  />
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <span className="section-title">4 · Delivery</span>
                  <span className="section-hint">
                    Where the parcel is going.
                  </span>
                </div>
                <div className="form-grid">
                  <label className="form-field">
                    <span className="label">Delivery area</span>
                    <input
                      className="input"
                      name="area"
                      placeholder="Business Bay"
                      required
                    />
                  </label>
                </div>
                <label className="form-field">
                  <span className="label">Delivery address</span>
                  <textarea
                    className="textarea"
                    name="address"
                    placeholder="Executive Towers, podium level, apt 1804"
                    required
                  />
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <span className="section-title">5 · Notes</span>
                  <span className="section-hint">
                    Anything the rider should know — timing, entry instructions,
                    exact change.
                  </span>
                </div>
                <label className="form-field">
                  <textarea
                    className="textarea"
                    name="notes"
                    placeholder="Call before arrival, leave with reception, cash must be exact."
                  />
                </label>
              </div>

              <button
                className="button"
                style={{ width: "100%", marginTop: 16 }}
                type="submit"
              >
                Create parcel request
              </button>
            </form>
          </article>

          <aside className="stack">
            <div className="panel stack">
              <div className="split">
                <div>
                  <div className="eyebrow">Queue preview</div>
                  <h3 style={{ margin: 0 }}>Waiting to assign</h3>
                </div>
                <span className="chip">{queue.length}</span>
              </div>

              {queue.length > 0 ? (
                <div className="list">
                  {queue.slice(0, 4).map((parcel) => (
                    <div className="list-item" key={parcel.id}>
                      <div className="split">
                        <strong style={{ fontSize: "0.88rem" }}>
                          {parcel.customerName}
                        </strong>
                        <span className="chip warn">
                          {formatCurrency(parcel.codAmountAed)}
                        </span>
                      </div>
                      <div
                        className="muted"
                        style={{ fontSize: "0.82rem", marginTop: 2 }}
                      >
                        {parcel.merchantName ?? "Merchant"} · {parcel.area}
                      </div>
                    </div>
                  ))}
                  <Link
                    className="button ghost"
                    href="/operator/dispatch"
                    style={{ width: "fit-content" }}
                  >
                    Open dispatch board
                    <ArrowRight
                      style={{ width: 14, height: 14, marginLeft: 6 }}
                    />
                  </Link>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>The queue is clear.</strong>
                  <span className="muted">
                    New requests will show up here instantly.
                  </span>
                </div>
              )}
            </div>

            {recentParcels.length > 0 ? (
              <div className="panel stack">
                <div>
                  <div className="eyebrow">Just captured</div>
                  <h3 style={{ margin: 0 }}>Recent requests</h3>
                </div>
                <div className="list">
                  {recentParcels.slice(0, 5).map((parcel) => (
                    <div className="list-item" key={parcel.id}>
                      <div className="split">
                        <strong style={{ fontSize: "0.88rem" }}>
                          {parcel.awb}
                        </strong>
                        <span className="chip">
                          {parcel.state.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: 2 }}>
                        {parcel.customerName}
                      </div>
                      <div
                        className="muted"
                        style={{ fontSize: "0.82rem", marginTop: 2 }}
                      >
                        {parcel.area}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      )}
    </>
  );
}

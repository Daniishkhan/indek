import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Inbox,
  MessageSquare,
  PauseCircle,
} from "lucide-react";
import { getOperatorIntakeData } from "@indek/domain";
import {
  approveParcelForDispatchAction,
  createOperatorParcelAction,
  holdParcelRequestAction,
  sendParcelFollowUpAction,
} from "@/app/actions";
import { ReviewQueueCard } from "@/components/review-queue-card";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "order-created": {
      tone: "success",
      text: "Parcel request created and moved straight to dispatch-ready.",
    },
    "order-missing-merchant": {
      tone: "warn",
      text: "Pick a merchant before creating a parcel request.",
    },
    "request-approved": {
      tone: "success",
      text: "Request approved and released to the dispatch board.",
    },
    "follow-up-sent": {
      tone: "success",
      text: "Merchant follow-up sent. The request is parked until they reply.",
    },
    "request-held": {
      tone: "success",
      text: "Request placed on hold. It will stay out of dispatch until reviewed again.",
    },
    "review-failed": {
      tone: "warn",
      text: "That review could not be saved. Complete the checklist and try again.",
    },
    "follow-up-failed": {
      tone: "warn",
      text: "The follow-up could not be sent. Add a message and try again.",
    },
    "hold-failed": {
      tone: "warn",
      text: "The hold could not be applied. Add a reason or message and try again.",
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
  const [{ merchants, queue, dispatchReady, recentParcels }, params] =
    await Promise.all([getOperatorIntakeData(), searchParams]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  const underReview = queue.filter((p) => p.reviewState === "under_review");
  const needsClarification = queue.filter(
    (p) => p.reviewState === "needs_clarification",
  );
  const onHold = queue.filter((p) => p.reviewState === "on_hold");

  const dispatchReadyCod = dispatchReady.reduce(
    (sum, p) => sum + p.codAmountAed,
    0,
  );

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Under review</span>
            <span className="kpi-icon amber">
              <ClipboardList />
            </span>
          </div>
          <div className="kpi-value">{underReview.length}</div>
          <div className="kpi-foot">
            <span>New merchant submissions</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Needs clarification</span>
            <span className="kpi-icon cyan">
              <MessageSquare />
            </span>
          </div>
          <div className="kpi-value">{needsClarification.length}</div>
          <div className="kpi-foot">
            <span>Waiting on merchant reply</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">On hold</span>
            <span className="kpi-icon danger">
              <PauseCircle />
            </span>
          </div>
          <div className="kpi-value">{onHold.length}</div>
          <div className="kpi-foot">
            <span>Paused by ops</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Dispatch ready</span>
            <span className="kpi-icon success">
              <CheckCircle2 />
            </span>
          </div>
          <div className="kpi-value">{dispatchReady.length}</div>
          <div className="kpi-foot">
            <span>{formatCurrencyCompact(dispatchReadyCod)} COD queued</span>
          </div>
        </article>
      </section>

      <section className="grid">
        <div className="stack">
          <div className="panel stack">
            <div className="split">
              <div>
                <div className="eyebrow">Review queue</div>
                <h2 style={{ margin: 0 }}>
                  Merchant submissions awaiting ops review
                </h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  Run the due-diligence checklist before a request goes to
                  dispatch. Send a follow-up if something is missing, or put the
                  request on hold if it needs more work.
                </p>
              </div>
              <span className="chip warn">{queue.length}</span>
            </div>

            {queue.length === 0 ? (
              <div className="empty-state">
                <strong>No requests waiting on review.</strong>
                <span className="muted">
                  New merchant submissions land here before reaching dispatch.
                </span>
              </div>
            ) : null}
          </div>

          {queue.map((parcel) => (
            <ReviewQueueCard
              approveAction={approveParcelForDispatchAction}
              followUpAction={sendParcelFollowUpAction}
              holdAction={holdParcelRequestAction}
              key={parcel.id}
              parcel={parcel}
            />
          ))}
        </div>

        <aside className="stack">
          <div className="panel stack">
            <div className="split">
              <div>
                <div className="eyebrow">Ready for dispatch</div>
                <h3 style={{ margin: 0 }}>Approved queue</h3>
              </div>
              <span className="chip success">{dispatchReady.length}</span>
            </div>

            {dispatchReady.length > 0 ? (
              <div className="list">
                {dispatchReady.slice(0, 5).map((parcel) => (
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
                    {parcel.reviewedByLabel ? (
                      <div
                        className="muted"
                        style={{ fontSize: "0.78rem", marginTop: 2 }}
                      >
                        Approved by {parcel.reviewedByLabel}
                      </div>
                    ) : null}
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
                <strong>Nothing queued for dispatch.</strong>
                <span className="muted">
                  Approve a review above to release it to the dispatch board.
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
                        {parcel.state === "unassigned"
                          ? parcel.reviewState.replace("_", " ")
                          : parcel.state.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: 2 }}>
                      {parcel.customerName}
                    </div>
                    <div
                      className="muted"
                      style={{ fontSize: "0.82rem", marginTop: 2 }}
                    >
                      {parcel.merchantName ?? "Merchant"} · {parcel.area}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="panel stack">
        <div className="split">
          <div>
            <div className="eyebrow">Operator intake</div>
            <h2 style={{ margin: 0 }}>Capture a WhatsApp / phone order</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Use this when a merchant sends a WhatsApp message, phone order, or
              spreadsheet row. Operator-created requests skip review and land
              straight on the dispatch board.
            </p>
          </div>
          <span className="chip">
            <Inbox style={{ width: 14, height: 14, marginRight: 4 }} />
            Manual intake
          </span>
        </div>

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
                <span className="section-hint">Where the parcel is going.</span>
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
        )}
      </section>

      {underReview.length === 0 &&
      needsClarification.length === 0 &&
      onHold.length > 0 ? (
        <section className="notice warn">
          <div className="stack-tight">
            <div className="label">
              <AlertCircle style={{ width: 14, height: 14, marginRight: 6 }} />
              Held requests
            </div>
            <strong>
              {onHold.length} request{onHold.length === 1 ? "" : "s"} still on
              hold
            </strong>
            <span className="muted">
              Review the held items above and either approve, follow-up, or
              clear them.
            </span>
          </div>
        </section>
      ) : null}
    </>
  );
}

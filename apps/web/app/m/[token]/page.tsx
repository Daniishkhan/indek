import { getMerchantPortalData } from "@indek/domain";
import { notFound } from "next/navigation";
import { createMerchantParcelAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const NOTICE_COPY: Record<string, string> = {
  "order-submitted":
    "Delivery request submitted. It is now visible in the operator queue.",
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
  const portal = await getMerchantPortalData(token);

  if (!portal) {
    notFound();
  }

  const { merchant, parcels, remittance, summary } = portal;
  const notice = noticeCode ? NOTICE_COPY[noticeCode] : undefined;

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Merchant portal</div>
        <h1>{merchant.name}</h1>
        <p>
          Place a delivery request, then keep watching its progress from the
          same page. This is the bare MVP loop the operator sees on their side.
        </p>
      </section>

      <section className="stats-grid">
        <article className="metric">
          <div className="label">Awaiting assignment</div>
          <div className="metric-value">{summary.awaitingAssignmentCount}</div>
          <div className="muted">Fresh requests waiting for dispatch</div>
        </article>
        <article className="metric">
          <div className="label">Active parcels</div>
          <div className="metric-value">{summary.activeCount}</div>
          <div className="muted">
            Already assigned or moving through the field
          </div>
        </article>
        <article className="metric">
          <div className="label">Delivered</div>
          <div className="metric-value">{summary.deliveredCount}</div>
          <div className="muted">Completed in the current visible cycle</div>
        </article>
        <article className="metric">
          <div className="label">Failed attempts</div>
          <div className="metric-value">{summary.failedCount}</div>
          <div className="muted">
            Needs operator reattempt or recovery handling
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Request a pickup</div>
            <h2>Create a new delivery order</h2>
            <p>
              This request lands directly in Indek as an unassigned parcel for
              the operator team.
            </p>
          </div>

          {notice ? <div className="notice success">{notice}</div> : null}

          <form action={createMerchantParcelAction} className="stack">
            <input name="token" type="hidden" value={merchant.token} />

            <div className="form-grid">
              <label className="form-field">
                <span className="label">Customer name</span>
                <input
                  className="input"
                  name="customerName"
                  placeholder="Maha Saeed"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Customer phone</span>
                <input
                  className="input"
                  name="customerPhone"
                  placeholder="+971 50 111 2233"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Area</span>
                <input
                  className="input"
                  name="area"
                  placeholder="JVC"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">COD amount</span>
                <input
                  className="input"
                  defaultValue="0"
                  min="0"
                  name="codAmountAed"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="label">Item summary</span>
                <input
                  className="input"
                  name="itemSummary"
                  placeholder="Dessert box"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span className="label">Address</span>
              <textarea
                className="textarea"
                name="address"
                placeholder="Belgravia Heights, Tower B, apt 307"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Notes</span>
              <textarea
                className="textarea"
                name="notes"
                placeholder="Call before arrival or leave with reception."
              />
            </label>

            <button className="button" type="submit">
              Submit delivery request
            </button>
          </form>
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

      <section className="panel stack">
        <div className="split">
          <div>
            <div className="eyebrow">Parcel status</div>
            <h2>Active and recent delivery requests</h2>
          </div>
          <span className="chip">{parcels.length} orders</span>
        </div>

        {parcels.length > 0 ? (
          <div className="list">
            {parcels.map((parcel) => (
              <div className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.awb}</strong>
                  <span className="chip">{parcel.state.replace("_", " ")}</span>
                </div>
                <div>{parcel.customerName}</div>
                <div className="muted">
                  {parcel.area} · {parcel.itemSummary} ·{" "}
                  {formatCurrency(parcel.codAmountAed)}
                </div>
                <div className="muted">{parcel.address}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No requests have been submitted yet.</strong>
            <span className="muted">
              The first order you submit above will show its status here and on
              the operator dashboard.
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

import Link from "next/link";
import { getMerchantPortalDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
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

  return (
    <>
      <section className="stats-grid">
        <article className="metric">
          <div className="label">Awaiting assignment</div>
          <div className="metric-value">{summary.awaitingAssignmentCount}</div>
          <div className="muted">Requests waiting for dispatch</div>
        </article>
        <article className="metric">
          <div className="label">Active parcels</div>
          <div className="metric-value">{summary.activeCount}</div>
          <div className="muted">
            Already out with riders or in exception handling
          </div>
        </article>
        <article className="metric">
          <div className="label">Delivered</div>
          <div className="metric-value">{summary.deliveredCount}</div>
          <div className="muted">
            Completed parcels in the current visible cycle
          </div>
        </article>
        <article className="metric">
          <div className="label">Open remittance</div>
          <div className="metric-value">
            {remittance ? formatCurrency(remittance.netPayableAed) : "AED 0.00"}
          </div>
          <div className="muted">
            Net payable after fees and VAT on delivered work
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Merchant account</div>
            <h2>{merchant.name}</h2>
            <p>
              This signed-in merchant route mirrors the merchant-facing view and
              keeps the role separate from operator and rider access.
            </p>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="label">Proof requirement</div>
              <div className="value">{merchant.proofRequirement}</div>
            </div>
            <div className="card">
              <div className="label">Remittance cycle</div>
              <div className="value">{merchant.remittanceCycle}</div>
            </div>
            <div className="card">
              <div className="label">Public merchant link</div>
              <div className="value">
                <Link href={`/m/${merchant.token}`}>Open token portal</Link>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="split">
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Current parcels
                </div>
                <h3 style={{ margin: 0 }}>Status visibility</h3>
              </div>
              <span className="chip">{parcels.length} parcels</span>
            </div>

            {parcels.length > 0 ? (
              <table className="table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>AWB</th>
                    <th>Customer</th>
                    <th>State</th>
                    <th>COD</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.map((parcel) => (
                    <tr key={parcel.id}>
                      <td>{parcel.awb}</td>
                      <td>{parcel.customerName}</td>
                      <td>{parcel.state.replace("_", " ")}</td>
                      <td>{formatCurrency(parcel.codAmountAed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ marginTop: 16 }}>
                <strong>No parcel activity yet.</strong>
                <span className="muted">
                  Use the public merchant portal link to create the first
                  request.
                </span>
              </div>
            )}
          </div>
        </article>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Remittance</div>
            <h2>Fee visibility</h2>
          </div>

          {remittance ? (
            <div className="list">
              <div className="list-item">
                <div className="label">Cycle</div>
                <div className="value">{remittance.cycleLabel}</div>
              </div>
              <div className="list-item">
                <div className="label">Net payable</div>
                <div className="metric-value">
                  {formatCurrency(remittance.netPayableAed)}
                </div>
              </div>
              <div className="list-item">
                <div className="label">VAT</div>
                <div className="value">{formatCurrency(remittance.vatAed)}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No delivered parcels yet.</strong>
              <span className="muted">
                Delivered work will roll into the merchant remittance summary
                here.
              </span>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

import Link from "next/link";
import { getOperatorOverviewData } from "@indek/domain";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function OperatorOverviewPage() {
  const { manifests, merchants, recentParcels, riders, snapshot, unassigned } =
    await getOperatorOverviewData();
  const newestRequest = unassigned[0];

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
              unassigned queue. Treat this as the admin notification for the
              workflow.
            </span>
          </div>
          <Link className="button secondary" href="/operator/dispatch">
            Open dispatch board
          </Link>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="metric">
          <div className="label">Merchant customers</div>
          <div className="metric-value">{snapshot.merchantCount}</div>
          <div className="muted">
            Request links and agreements managed from one place
          </div>
        </article>
        <article className="metric">
          <div className="label">Riders live</div>
          <div className="metric-value">{snapshot.riderCount}</div>
          <div className="muted">
            Available, on-shift, returning, and off-shift coverage
          </div>
        </article>
        <article className="metric">
          <div className="label">Orders waiting</div>
          <div className="metric-value">{snapshot.unassigned}</div>
          <div className="muted">
            Fresh requests ready for intake review and assignment
          </div>
        </article>
        <article className="metric">
          <div className="label">COD exposure</div>
          <div className="metric-value">
            {formatCurrency(snapshot.codExposureAed)}
          </div>
          <div className="muted">
            Delivered cash still sitting with riders right now
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Tonight MVP</div>
            <h2>Merchant request to operator board is now one live loop</h2>
            <p>
              Merchants can place delivery requests, operators can create intake
              records and assign manifests, and the status stays visible from
              the same data instead of mock arrays.
            </p>
          </div>

          <div className="cards-grid">
            <Link className="card" href="/operator/intake">
              <h3>Intake desk</h3>
              <p>
                Create merchants, add riders, and capture requests manually.
              </p>
            </Link>
            <Link className="card" href="/operator/dispatch">
              <h3>Dispatch board</h3>
              <p>
                Assign waiting parcels to riders and turn them into manifests.
              </p>
            </Link>
            <Link className="card" href="/operator/live">
              <h3>Live ops</h3>
              <p>
                See rider load, cash exposure, and links into reconciliation.
              </p>
            </Link>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="split">
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Recent requests
                </div>
                <h3 style={{ margin: 0 }}>Latest parcel intake</h3>
              </div>
              <span className="chip">{recentParcels.length} visible</span>
            </div>

            {recentParcels.length > 0 ? (
              <table className="table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>AWB</th>
                    <th>Merchant</th>
                    <th>Customer</th>
                    <th>State</th>
                    <th>COD</th>
                  </tr>
                </thead>
                <tbody>
                  {recentParcels.map((parcel) => (
                    <tr key={parcel.id}>
                      <td>{parcel.awb}</td>
                      <td>{parcel.merchantName ?? "Merchant"}</td>
                      <td>{parcel.customerName}</td>
                      <td>{parcel.state.replace("_", " ")}</td>
                      <td>{formatCurrency(parcel.codAmountAed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ marginTop: 16 }}>
                <strong>No parcel requests yet.</strong>
                <span className="muted">
                  Create a merchant and submit the first order from the intake
                  desk or the merchant portal.
                </span>
              </div>
            )}
          </div>
        </article>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Needs action</div>
            <h2>Dispatch-ready queue</h2>
          </div>

          {unassigned.length > 0 ? (
            <div className="list">
              {unassigned.slice(0, 6).map((parcel) => (
                <div className="list-item" key={parcel.id}>
                  <div className="split">
                    <strong>{parcel.awb}</strong>
                    <span className="chip warn">
                      {formatCurrency(parcel.codAmountAed)}
                    </span>
                  </div>
                  <div>{parcel.customerName}</div>
                  <div className="muted">
                    {parcel.merchantName ?? "Merchant"} · {parcel.area}
                  </div>
                  {parcel.pickupAddress ? (
                    <div className="muted">Pickup: {parcel.pickupAddress}</div>
                  ) : null}
                  {parcel.averageShippingChargeAed !== undefined ? (
                    <div className="muted">
                      Average shipping charge:{" "}
                      {formatCurrency(parcel.averageShippingChargeAed)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No unassigned requests right now.</strong>
              <span className="muted">
                New merchant submissions and manual intake orders will show up
                here immediately.
              </span>
            </div>
          )}

          <div className="stack">
            <div className="split">
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Merchant portals
                </div>
                <h3 style={{ margin: 0 }}>Shareable request links</h3>
              </div>
              <span className="chip">{merchants.length}</span>
            </div>
            {merchants.length > 0 ? (
              <div className="list">
                {merchants.map((merchant) => (
                  <Link
                    className="list-item interactive-card"
                    key={merchant.id}
                    href={`/m/${merchant.token}`}
                  >
                    <div className="split">
                      <strong>{merchant.name}</strong>
                      <span className="chip">{merchant.remittanceCycle}</span>
                    </div>
                    <div className="muted">
                      Merchant request + status page under a tokenized link
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Create the first merchant from intake.</strong>
                <span className="muted">
                  Every merchant gets a tokenized portal for placing requests
                  and checking status.
                </span>
              </div>
            )}
          </div>

          <div className="stack">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Fleet pressure
            </div>
            <h3 style={{ margin: 0 }}>Rider roster snapshot</h3>
            <div className="list">
              {riders.slice(0, 4).map((rider) => (
                <div className="list-item" key={rider.id}>
                  <div className="split">
                    <strong>{rider.name}</strong>
                    <span className="chip">
                      {rider.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="muted">
                    {rider.zone} · {rider.parcelsInCustody} in custody ·{" "}
                    {formatCurrency(rider.cashHeldAed)} cash held
                  </div>
                </div>
              ))}
            </div>
            <div className="muted">
              {manifests.length} manifest{manifests.length === 1 ? "" : "s"}{" "}
              currently open.
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

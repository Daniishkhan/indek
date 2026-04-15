import { getManifestForRider, getParcelsForRider, getRiderById } from "@indek/domain";
import { notFound } from "next/navigation";

export default async function ReconciliationPage({
  params
}: {
  params: Promise<{ riderId: string }>;
}) {
  const { riderId } = await params;
  const rider = getRiderById(riderId);

  if (!rider) {
    notFound();
  }

  const manifest = getManifestForRider(riderId);
  const parcels = getParcelsForRider(riderId);
  const expectedCash = rider.cashHeldAed;
  const actualCash = rider.id === "r-umar" ? 1890 : rider.cashHeldAed;
  const variance = actualCash - expectedCash;

  return (
    <section className="grid">
      <article className="panel">
        <div className="eyebrow">Journey 6</div>
        <h2>{rider.name} reconciliation</h2>
        <div className="two-col">
          <div className="card">
            <div className="label">Expected</div>
            <div className="metric-value">{parcels.length} parcels</div>
            <p>Manifest {manifest?.id ?? "not assigned"} still holds the custody baseline.</p>
          </div>
          <div className="card">
            <div className="label">Cash expected</div>
            <div className="metric-value">AED {expectedCash}</div>
            <p>Personal float remains separate from COD collections by design.</p>
          </div>
        </div>

        <table className="table" style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Parcel</th>
              <th>State</th>
              <th>Area</th>
              <th>COD</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.id}>
                <td>{parcel.awb}</td>
                <td>{parcel.state.replace("_", " ")}</td>
                <td>{parcel.area}</td>
                <td>AED {parcel.codAmountAed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <aside className="panel">
        <div className="eyebrow">Close loop</div>
        <h2>Cash variance decision</h2>
        <div className="list">
          <div className="list-item">
            <div className="label">Actual cash counted</div>
            <div className="metric-value">AED {actualCash}</div>
          </div>
          <div className="list-item">
            <div className="label">Variance</div>
            <div className={`metric-value`} style={{ color: variance ? "var(--danger)" : "var(--accent)" }}>
              AED {variance}
            </div>
            <div className={`chip ${variance ? "danger" : ""}`}>
              {variance ? "Reason required before close" : "Ready to close"}
            </div>
          </div>
          <div className="list-item">
            <strong>Suggested reason code</strong>
            <div className="muted">
              {variance
                ? "Cash short - rider float adjustment"
                : "No write-off needed"}
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

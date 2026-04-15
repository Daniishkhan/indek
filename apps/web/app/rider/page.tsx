import { getManifestForRider, getParcelsForRider, getRiderById } from "@indek/domain";

const riderId = "r-hassan";

export default function RiderHomePage() {
  const rider = getRiderById(riderId);
  const manifest = getManifestForRider(riderId);
  const parcels = getParcelsForRider(riderId);

  if (!rider || !manifest) {
    return null;
  }

  return (
    <>
      <section className="panel">
        <div className="eyebrow">Journey 3 and 4</div>
        <h2>{rider.name}</h2>
        <div className="two-col">
          <div className="card">
            <div className="label">Manifest status</div>
            <div className="value">{manifest.accepted ? "Accepted" : "Pending acceptance"}</div>
            <p>
              {manifest.pickupCount} pickups · {manifest.parcelIds.length} parcels ·{" "}
              {manifest.zoneSummary}
            </p>
          </div>
          <div className="card">
            <div className="label">Cash held</div>
            <div className="metric-value">AED {rider.cashHeldAed}</div>
            <p>Float AED {rider.personalFloatAed} tracked separately for change-making.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="split">
          <div>
            <div className="eyebrow">Offline-aware worklist</div>
            <h2>Parcels in custody</h2>
          </div>
          <div className="chip">Online · 0 pending sync</div>
        </div>
        <div className="list">
          {parcels.map((parcel) => (
            <article className="list-item" key={parcel.id}>
              <div className="split">
                <strong>{parcel.customerName}</strong>
                <span className="chip warn">AED {parcel.codAmountAed}</span>
              </div>
              <div>{parcel.address}</div>
              <div className="muted">{parcel.itemSummary}</div>
              <div className="cta-row">
                <span className="button secondary">Delivered</span>
                <span className="button secondary">Failed</span>
                <span className="button secondary">Partial</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

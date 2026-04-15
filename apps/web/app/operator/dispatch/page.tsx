import { listActiveManifests, listRiders, listUnassignedParcels } from "@indek/domain";

export default function DispatchBoardPage() {
  const riders = listRiders();
  const parcels = listUnassignedParcels();
  const manifests = listActiveManifests();

  return (
    <section className="grid">
      <article className="panel">
        <div className="eyebrow">Journey 2</div>
        <h2>Assignment board</h2>
        <p>
          The MVP shape is here: unassigned work on the left, rider roster on
          the right, and manifest previews that keep COD and pickup complexity
          visible before assignment.
        </p>
        <div className="list">
          {parcels.map((parcel) => (
            <div className="list-item" key={parcel.id}>
              <div className="split">
                <strong>{parcel.awb}</strong>
                <span className="chip">{parcel.area}</span>
              </div>
              <div>{parcel.customerName}</div>
              <div className="muted">
                {parcel.itemSummary} · AED {parcel.codAmountAed}
              </div>
            </div>
          ))}
        </div>
      </article>

      <aside className="panel">
        <div className="eyebrow">Rider roster</div>
        <h2>Manifest previews</h2>
        <div className="list">
          {riders.map((rider) => {
            const manifest = manifests.find((item) => item.riderId === rider.id);
            return (
              <div className="list-item" key={rider.id}>
                <div className="split">
                  <strong>{rider.name}</strong>
                  <span className="chip">{rider.status.replace("_", " ")}</span>
                </div>
                <div className="muted">{rider.zone}</div>
                {manifest ? (
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label">Pending manifest</div>
                    <div className="value">
                      {manifest.parcelIds.length} parcels · AED {manifest.expectedCodAed}
                    </div>
                    <div className="muted">
                      {manifest.pickupCount} pickups · {manifest.zoneSummary}
                    </div>
                  </div>
                ) : (
                  <div className="muted">No pending manifest</div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

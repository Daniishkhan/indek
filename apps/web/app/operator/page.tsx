import Link from "next/link";
import {
  getOpsSnapshot,
  listActiveManifests,
  listRiders,
  listUnassignedParcels
} from "@indek/domain";

export default function OperatorOverviewPage() {
  const snapshot = getOpsSnapshot();
  const riders = listRiders();
  const manifests = listActiveManifests();
  const unassigned = listUnassignedParcels();

  return (
    <>
      <section className="stats-grid">
        <article className="metric">
          <div className="label">Riders live</div>
          <div className="metric-value">{riders.length}</div>
          <div className="muted">Available, on shift, and returning fleet view</div>
        </article>
        <article className="metric">
          <div className="label">Unassigned parcels</div>
          <div className="metric-value">{snapshot.unassigned}</div>
          <div className="muted">Ready for the next manifest build</div>
        </article>
        <article className="metric">
          <div className="label">Active manifests</div>
          <div className="metric-value">{manifests.length}</div>
          <div className="muted">Accepted plus pending rider assignments</div>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="eyebrow">Today’s operator loop</div>
          <h2>Start with the next highest-leverage decision</h2>
          <div className="cards-grid">
            <Link className="card" href="/operator/intake">
              <h3>Intake batches</h3>
              <p>
                Paste Excel or WhatsApp rows into a merchant-scoped intake flow
                and turn them into labeled parcels.
              </p>
            </Link>
            <Link className="card" href="/operator/dispatch">
              <h3>Build manifests</h3>
              <p>
                Assign unassigned parcels to riders with expected COD, pickups,
                and zone summary in one place.
              </p>
            </Link>
            <Link className="card" href="/operator/live">
              <h3>Monitor anomalies</h3>
              <p>
                Watch idle riders, growing cash exposure, and failed-attempt
                trends before they become disputes.
              </p>
            </Link>
          </div>
        </article>

        <aside className="panel">
          <div className="eyebrow">Needs action</div>
          <h2>Unassigned queue</h2>
          <div className="list">
            {unassigned.map((parcel) => (
              <div className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.awb}</strong>
                  <span className="chip warn">AED {parcel.codAmountAed}</span>
                </div>
                <div>{parcel.customerName}</div>
                <div className="muted">
                  {parcel.area} · {parcel.itemSummary}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}

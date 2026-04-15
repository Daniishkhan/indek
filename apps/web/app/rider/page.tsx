import { getRiderDashboardDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function RiderHomePage() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const dashboard = await getRiderDashboardDataForUser(session.user.id);

  if (!dashboard) {
    return (
      <section className="panel">
        <div className="eyebrow">Rider PWA</div>
        <h2>No rider profile is linked yet</h2>
        <p>
          This account can sign in on the rider route, but it has not been
          linked to a rider profile in Indek yet.
        </p>
      </section>
    );
  }

  const { manifest, parcels, rider } = dashboard;

  return (
    <>
      <section className="panel">
        <div className="eyebrow">Journey 3 and 4</div>
        <h2>{rider.name}</h2>
        <div className="two-col">
          <div className="card">
            <div className="label">Manifest status</div>
            <div className="value">
              {manifest
                ? manifest.accepted
                  ? "Accepted"
                  : "Pending acceptance"
                : "No manifest yet"}
            </div>
            <p>
              {manifest
                ? `${manifest.pickupCount} pickups · ${manifest.parcelIds.length} parcels · ${manifest.zoneSummary}`
                : "Ops has not assigned work to this rider yet."}
            </p>
          </div>
          <div className="card">
            <div className="label">Cash held</div>
            <div className="metric-value">
              {formatCurrency(rider.cashHeldAed)}
            </div>
            <p>
              Float {formatCurrency(rider.personalFloatAed)} tracked separately
              for change-making.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="split">
          <div>
            <div className="eyebrow">Shift worklist</div>
            <h2>Parcels in custody</h2>
          </div>
          <div className="chip">
            {parcels.length === 0
              ? "No parcels assigned"
              : `${parcels.length} visible`}
          </div>
        </div>
        {parcels.length > 0 ? (
          <div className="list">
            {parcels.map((parcel) => (
              <article className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.customerName}</strong>
                  <span className="chip warn">
                    {formatCurrency(parcel.codAmountAed)}
                  </span>
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
        ) : (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <strong>Nothing in custody yet.</strong>
            <span className="muted">
              As soon as ops assigns a manifest, parcels will appear here for
              the rider.
            </span>
          </div>
        )}
      </section>
    </>
  );
}

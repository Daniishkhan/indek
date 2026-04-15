import { getDispatchBoardData } from "@indek/domain";
import { assignManifestAction } from "@/app/actions";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "manifest-created": {
      tone: "success",
      text: "Manifest assigned. The selected parcels are now attached to a rider.",
    },
    "manifest-missing-selection": {
      tone: "warn",
      text: "Choose a rider and at least one parcel before assigning a manifest.",
    },
    "manifest-failed": {
      tone: "warn",
      text: "That manifest could not be created. Refresh and try again.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function DispatchBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ manifests, parcels, riders }, params] = await Promise.all([
    getDispatchBoardData(),
    searchParams,
  ]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  return (
    <section className="grid">
      <article className="panel stack">
        <div>
          <div className="eyebrow">Journey 2</div>
          <h2>Assignment board</h2>
          <p>
            This MVP uses a fast, boring dispatch flow: choose a rider, select
            the waiting parcels, create one manifest, and send the work into the
            field.
          </p>
        </div>

        {notice ? (
          <div className={`notice ${notice.tone}`}>{notice.text}</div>
        ) : null}

        {riders.length > 0 && parcels.length > 0 ? (
          <form action={assignManifestAction} className="stack">
            <label className="form-field">
              <span className="label">Assign to rider</span>
              <select className="select" name="riderId" required>
                <option value="">Select rider</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name} · {rider.zone} ·{" "}
                    {rider.status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <div className="checkbox-list">
              {parcels.map((parcel) => (
                <label className="checkbox-item" key={parcel.id}>
                  <div className="checkbox-head">
                    <input name="parcelIds" type="checkbox" value={parcel.id} />
                    <div className="stack-tight">
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
                      <div className="muted">{parcel.address}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button className="button" type="submit">
              Create manifest
            </button>
          </form>
        ) : (
          <div className="empty-state">
            <strong>Dispatch needs both riders and waiting parcels.</strong>
            <span className="muted">
              Add riders from intake, then create or receive parcel requests.
            </span>
          </div>
        )}
      </article>

      <aside className="panel stack">
        <div>
          <div className="eyebrow">Rider roster</div>
          <h2>Live manifest previews</h2>
        </div>

        <div className="list">
          {riders.map((rider) => {
            const manifest = manifests.find(
              (item) => item.riderId === rider.id,
            );
            return (
              <div className="list-item" key={rider.id}>
                <div className="split">
                  <strong>{rider.name}</strong>
                  <span className="chip">{rider.status.replace("_", " ")}</span>
                </div>
                <div className="muted">
                  {rider.zone} · {rider.parcelsInCustody} in custody
                </div>
                {manifest ? (
                  <div className="card" style={{ padding: 16 }}>
                    <div className="label">Latest manifest</div>
                    <div className="value">
                      {manifest.parcelIds.length} parcels ·{" "}
                      {formatCurrency(manifest.expectedCodAed)}
                    </div>
                    <div className="muted">
                      {manifest.pickupCount} pickups · {manifest.zoneSummary}
                    </div>
                  </div>
                ) : (
                  <div className="muted">No assigned manifest yet.</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="stack">
          <div>
            <div className="eyebrow">Open manifests</div>
            <h3 style={{ margin: 0 }}>Current board output</h3>
          </div>
          {manifests.length > 0 ? (
            <div className="list">
              {manifests.map((manifest) => (
                <div className="list-item" key={manifest.id}>
                  <div className="split">
                    <strong>{manifest.riderName ?? manifest.riderId}</strong>
                    <span className="chip">
                      {manifest.accepted ? "accepted" : "awaiting acceptance"}
                    </span>
                  </div>
                  <div className="muted">
                    {manifest.zoneSummary} · {manifest.pickupCount} pickups
                  </div>
                  <div className="muted">
                    {manifest.parcelIds.length} parcels ·{" "}
                    {formatCurrency(manifest.expectedCodAed)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No manifests have been created yet.</strong>
              <span className="muted">
                Your first assignment will appear here with rider and COD
                totals.
              </span>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

import { getRiderDashboardDataForUser } from "@indek/domain";
import {
  acceptManifestAction,
  recordParcelDeliveredAction,
  recordParcelFailedAction,
} from "@/app/actions";
import { getCurrentSession } from "@/lib/session";
import { failureReasons, type FailureReason } from "@indek/shared";

const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  customer_not_home: "Customer not home",
  customer_refused: "Customer refused",
  reschedule_requested: "Reschedule requested",
  other: "Other",
};

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "manifest-accepted": {
      tone: "success",
      text: "Manifest accepted. Assigned parcels are now in transit.",
    },
    "manifest-accept-failed": {
      tone: "warn",
      text: "That manifest could not be accepted. Refresh and try again.",
    },
    "parcel-delivered": {
      tone: "success",
      text: "Parcel marked delivered.",
    },
    "parcel-failed": {
      tone: "success",
      text: "Parcel marked failed and removed from the active worklist.",
    },
    "failure-reason-required": {
      tone: "warn",
      text: "Choose a failure reason before marking the parcel failed.",
    },
    "delivery-failed": {
      tone: "warn",
      text: "That parcel could not be updated. Refresh and try again.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function RiderHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [session, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);
  if (!session) {
    return null;
  }

  const dashboard = await getRiderDashboardDataForUser(session.user.id);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

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
  const queuedParcels = parcels.filter((parcel) => parcel.state === "assigned");
  const activeParcels = parcels.filter(
    (parcel) => parcel.state === "in_transit",
  );
  const completedParcels = parcels.filter(
    (parcel) => parcel.state === "delivered" || parcel.state === "failed",
  );

  return (
    <>
      <section className="panel stack">
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

        {notice ? (
          <div className={`notice ${notice.tone}`}>{notice.text}</div>
        ) : null}
      </section>

      {manifest && !manifest.accepted ? (
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Accept work</div>
              <h2>Manifest ready to start</h2>
            </div>
            <span className="chip">{queuedParcels.length} assigned</span>
          </div>
          <p>
            Accept the manifest to move the assigned parcels into transit and
            start the delivery slice.
          </p>
          <form action={acceptManifestAction}>
            <input name="manifestId" type="hidden" value={manifest.id} />
            <button className="button" type="submit">
              Accept manifest
            </button>
          </form>

          {queuedParcels.length > 0 ? (
            <div className="list">
              {queuedParcels.map((parcel) => (
                <article className="list-item" key={parcel.id}>
                  <div className="split">
                    <strong>{parcel.customerName}</strong>
                    <span className="chip warn">
                      {formatCurrency(parcel.codAmountAed)}
                    </span>
                  </div>
                  <div>{parcel.address}</div>
                  <div className="muted">{parcel.itemSummary}</div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel stack">
        <div className="split">
          <div>
            <div className="eyebrow">Shift worklist</div>
            <h2>Active delivery outcomes</h2>
          </div>
          <div className="chip">
            {activeParcels.length === 0
              ? "No active parcels"
              : `${activeParcels.length} active`}
          </div>
        </div>

        {activeParcels.length > 0 ? (
          <div className="list">
            {activeParcels.map((parcel) => (
              <article className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.customerName}</strong>
                  <span className="chip warn">
                    {formatCurrency(parcel.codAmountAed)}
                  </span>
                </div>
                <div>{parcel.address}</div>
                <div className="muted">{parcel.itemSummary}</div>
                <div className="action-stack">
                  <form action={recordParcelDeliveredAction}>
                    <input name="parcelId" type="hidden" value={parcel.id} />
                    <button className="button" type="submit">
                      Delivered
                    </button>
                  </form>

                  <form
                    action={recordParcelFailedAction}
                    className="action-form"
                  >
                    <input name="parcelId" type="hidden" value={parcel.id} />
                    <select
                      className="select"
                      defaultValue=""
                      name="reason"
                      required
                    >
                      <option disabled value="">
                        Select failure reason
                      </option>
                      {failureReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {FAILURE_REASON_LABELS[reason]}
                        </option>
                      ))}
                    </select>
                    <button className="button secondary" type="submit">
                      Failed
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No in-transit parcels right now.</strong>
            <span className="muted">
              Accept a manifest first, or finish assignment from the operator
              board before returning here.
            </span>
          </div>
        )}
      </section>

      {completedParcels.length > 0 ? (
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Completed in this session</div>
              <h2>Recently resolved parcels</h2>
            </div>
            <span className="chip">{completedParcels.length} completed</span>
          </div>

          <div className="list">
            {completedParcels.map((parcel) => (
              <article className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.awb}</strong>
                  <span
                    className={`chip ${parcel.state === "failed" ? "danger" : ""}`}
                  >
                    {parcel.state.replace("_", " ")}
                  </span>
                </div>
                <div>{parcel.customerName}</div>
                <div className="muted">
                  Updated {new Date(parcel.lastUpdateAt).toLocaleString()}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

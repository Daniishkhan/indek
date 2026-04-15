import { CheckCircle2, MapPin, Wallet } from "lucide-react";
import { getRiderDashboardDataForUser } from "@indek/domain";
import {
  acceptManifestAction,
  recordParcelDeliveredAction,
  recordParcelFailedAction,
} from "@/app/actions";
import { getCurrentSession } from "@/lib/session";
import { failureReasons, type FailureReason } from "@indek/shared";
import { ProgressRing, chartColors } from "@/components/charts";

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
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
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
        <div className="eyebrow">Rider workspace</div>
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
  const deliveredParcels = parcels.filter((p) => p.state === "delivered");
  const failedParcels = parcels.filter((p) => p.state === "failed");
  const totalInShift = parcels.length;
  const completedCount = deliveredParcels.length + failedParcels.length;

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article
          className="panel"
          style={{ gridColumn: "span 2", padding: 18 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 22,
              alignItems: "center",
            }}
          >
            <ProgressRing
              value={completedCount}
              total={Math.max(totalInShift, 1)}
              label="Completed"
              color={chartColors[2]}
            />
            <div className="stack-tight">
              <div className="eyebrow" style={{ margin: 0 }}>
                {rider.zone} · {rider.status.replace("_", " ")}
              </div>
              <h2 style={{ margin: "4px 0 2px", fontSize: "1.25rem" }}>
                {rider.name}
              </h2>
              <div className="muted" style={{ fontSize: "0.88rem" }}>
                {deliveredParcels.length} delivered · {failedParcels.length}{" "}
                failed · {activeParcels.length} in transit
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="chip primary">
                  {manifest
                    ? manifest.accepted
                      ? "Manifest accepted"
                      : "Awaiting acceptance"
                    : "No manifest yet"}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Cash held</span>
            <span className="kpi-icon success">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(rider.cashHeldAed)}</div>
          <div className="kpi-foot">
            <span>Float {formatCurrency(rider.personalFloatAed)}</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">In custody</span>
            <span className="kpi-icon">
              <MapPin />
            </span>
          </div>
          <div className="kpi-value">{rider.parcelsInCustody}</div>
          <div className="kpi-foot">
            <span>
              {manifest
                ? `${manifest.pickupCount} pickups · ${manifest.zoneSummary}`
                : "No active manifest"}
            </span>
          </div>
        </article>
      </section>

      {manifest && !manifest.accepted ? (
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Accept work</div>
              <h2 style={{ margin: 0 }}>Manifest ready to start</h2>
            </div>
            <span className="chip warn">{queuedParcels.length} assigned</span>
          </div>
          <p>
            Accept the manifest to move assigned parcels into transit and start
            the delivery slice.
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
                  <div style={{ fontSize: "0.9rem" }}>{parcel.address}</div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {parcel.itemSummary}
                  </div>
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
            <h2 style={{ margin: 0 }}>Active deliveries</h2>
          </div>
          <span className="chip primary">
            {activeParcels.length === 0
              ? "No active parcels"
              : `${activeParcels.length} active`}
          </span>
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
                <div style={{ fontSize: "0.9rem" }}>{parcel.address}</div>
                <div className="muted" style={{ fontSize: "0.82rem" }}>
                  {parcel.itemSummary}
                </div>
                <div className="action-stack">
                  <form action={recordParcelDeliveredAction}>
                    <input name="parcelId" type="hidden" value={parcel.id} />
                    <button className="button" type="submit">
                      <CheckCircle2
                        style={{ width: 16, height: 16, marginRight: 6 }}
                      />
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
              Accept a manifest first, or wait for operations to dispatch work.
            </span>
          </div>
        )}
      </section>

      {completedCount > 0 ? (
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Completed this shift</div>
              <h2 style={{ margin: 0 }}>Resolved parcels</h2>
            </div>
            <span className="chip">{completedCount}</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>AWB</th>
                <th>Customer</th>
                <th>Outcome</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {[...deliveredParcels, ...failedParcels].map((parcel) => (
                <tr key={parcel.id}>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {parcel.awb}
                  </td>
                  <td>{parcel.customerName}</td>
                  <td>
                    <span
                      className={`status-dot ${
                        parcel.state === "delivered" ? "success" : "danger"
                      }`}
                    >
                      {parcel.state.replace("_", " ")}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: "0.82rem" }}>
                    {new Date(parcel.lastUpdateAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}

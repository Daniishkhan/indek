import { Package, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { getRiderDashboardDataForUser } from "@indek/domain";
import { acceptManifestAction } from "@/app/actions";
import { getCurrentSession } from "@/lib/session";
import { ProgressRing, chartColors } from "@/components/charts";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "manifest-accepted": {
      tone: "success",
      text: "Work accepted — go to Deliveries to start.",
    },
    "manifest-accept-failed": {
      tone: "warn",
      text: "Could not accept work. Try again.",
    },
    "parcel-delivered": {
      tone: "success",
      text: "Parcel marked as delivered.",
    },
    "parcel-failed": {
      tone: "success",
      text: "Parcel marked as failed.",
    },
    "failure-reason-required": {
      tone: "warn",
      text: "Pick a reason before marking failed.",
    },
    "delivery-failed": {
      tone: "warn",
      text: "Something went wrong. Try again.",
    },
  };

export default async function RiderHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [session, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);
  if (!session) return null;

  const dashboard = await getRiderDashboardDataForUser(session.user.id);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  if (!dashboard) {
    return (
      <section className="panel">
        <h2>Not set up yet</h2>
        <p>
          Your account is not linked to a rider profile. Ask your operator to
          set you up.
        </p>
      </section>
    );
  }

  const { manifest, parcels, rider } = dashboard;
  const queuedParcels = parcels.filter((p) => p.state === "assigned");
  const activeParcels = parcels.filter((p) => p.state === "in_transit");
  const deliveredParcels = parcels.filter((p) => p.state === "delivered");
  const failedParcels = parcels.filter((p) => p.state === "failed");
  const totalInShift = parcels.length;
  const completedCount = deliveredParcels.length + failedParcels.length;

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      {/* Rider greeting + progress */}
      <section className="panel" style={{ padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          <ProgressRing
            value={completedCount}
            total={Math.max(totalInShift, 1)}
            label="Done"
            color={chartColors[2]}
          />
          <div className="stack-tight">
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{rider.name}</h2>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              {rider.zone} &middot;{" "}
              {rider.status === "on_shift"
                ? "On shift"
                : rider.status === "returning"
                  ? "Returning"
                  : rider.status === "available"
                    ? "Available"
                    : "Off shift"}
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        <article className="panel" style={{ padding: 14, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <Truck style={{ width: 20, height: 20, color: "var(--primary)" }} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {activeParcels.length}
          </div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            To deliver
          </div>
        </article>

        <article className="panel" style={{ padding: 14, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <CheckCircle2
              style={{ width: 20, height: 20, color: "var(--success)" }}
            />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {deliveredParcels.length}
          </div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Delivered
          </div>
        </article>

        <article className="panel" style={{ padding: 14, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <AlertTriangle
              style={{ width: 20, height: 20, color: "var(--danger)" }}
            />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {failedParcels.length}
          </div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Failed
          </div>
        </article>
      </section>

      {/* Manifest acceptance */}
      {manifest && !manifest.accepted ? (
        <section className="panel stack" style={{ padding: 20 }}>
          <div className="split">
            <div>
              <div className="eyebrow">New work assigned</div>
              <h2 style={{ margin: 0 }}>
                {queuedParcels.length} parcel
                {queuedParcels.length !== 1 ? "s" : ""} to pick up
              </h2>
            </div>
            <span className="chip warn">
              {formatCurrency(manifest.expectedCodAed)} COD
            </span>
          </div>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {manifest.pickupCount} pickup
            {manifest.pickupCount !== 1 ? "s" : ""} &middot;{" "}
            {manifest.zoneSummary}
          </p>

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
                  <div className="muted" style={{ fontSize: "0.88rem" }}>
                    {parcel.area} &middot; {parcel.itemSummary}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <form action={acceptManifestAction}>
            <input name="manifestId" type="hidden" value={manifest.id} />
            <button
              className="button"
              type="submit"
              style={{ width: "100%", height: 48, fontSize: "1rem" }}
            >
              <Package style={{ width: 18, height: 18, marginRight: 8 }} />
              Accept Work
            </button>
          </form>
        </section>
      ) : null}

      {/* Active work summary — link to deliveries */}
      {activeParcels.length > 0 ? (
        <a
          href="/rider/deliveries"
          className="panel"
          style={{
            display: "block",
            padding: 20,
            textDecoration: "none",
            color: "inherit",
            border: "2px solid var(--primary)",
          }}
        >
          <div className="split">
            <div>
              <strong style={{ fontSize: "1.05rem" }}>
                {activeParcels.length} delivery
                {activeParcels.length !== 1 ? " runs" : ""} waiting
              </strong>
              <div className="muted" style={{ fontSize: "0.88rem" }}>
                Tap to see your delivery list
              </div>
            </div>
            <span style={{ fontSize: "1.2rem", color: "var(--primary)" }}>
              &rarr;
            </span>
          </div>
        </a>
      ) : manifest && manifest.accepted ? (
        <section className="panel" style={{ padding: 20 }}>
          <div className="empty-state">
            <strong>All parcels done for today</strong>
            <span className="muted">
              Head to the Cash page to check your handover total.
            </span>
          </div>
        </section>
      ) : !manifest ? (
        <section className="panel" style={{ padding: 20 }}>
          <div className="empty-state">
            <strong>No work assigned yet</strong>
            <span className="muted">
              Wait for your operator to assign you parcels.
            </span>
          </div>
        </section>
      ) : null}
    </>
  );
}

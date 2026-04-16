import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { getRiderDashboardDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RiderDonePage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const dashboard = await getRiderDashboardDataForUser(session.user.id);
  if (!dashboard) {
    return (
      <section className="panel">
        <h2>Not set up yet</h2>
        <p>Ask your operator to link your rider profile.</p>
      </section>
    );
  }

  const { parcels } = dashboard;
  const deliveredParcels = parcels.filter((p) => p.state === "delivered");
  const failedParcels = parcels.filter((p) => p.state === "failed");
  const allDone = [...deliveredParcels, ...failedParcels].sort(
    (a, b) =>
      new Date(b.lastUpdateAt).getTime() - new Date(a.lastUpdateAt).getTime(),
  );

  if (allDone.length === 0) {
    return (
      <section className="panel" style={{ padding: 20 }}>
        <div className="empty-state">
          <strong>Nothing completed yet</strong>
          <span className="muted">Completed deliveries will show up here.</span>
        </div>
      </section>
    );
  }

  const totalCodCollected = deliveredParcels.reduce(
    (sum, p) => sum + p.codAmountAed,
    0,
  );

  return (
    <>
      {/* Summary bar */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div className="panel" style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {allDone.length}
          </div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>
            Total
          </div>
        </div>
        <div className="panel" style={{ padding: 12, textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--success)",
            }}
          >
            {deliveredParcels.length}
          </div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>
            Delivered
          </div>
        </div>
        <div className="panel" style={{ padding: 12, textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--danger)",
            }}
          >
            {failedParcels.length}
          </div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>
            Failed
          </div>
        </div>
      </section>

      {totalCodCollected > 0 ? (
        <div
          className="panel"
          style={{
            padding: "10px 16px",
            background: "var(--surface-muted)",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          Cash collected: <strong>{formatCurrency(totalCodCollected)}</strong>
        </div>
      ) : null}

      {/* Completed list */}
      <div className="stack">
        {allDone.map((parcel) => (
          <Link
            href={`/rider/parcel/${parcel.id}`}
            key={parcel.id}
            className="panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {parcel.state === "delivered" ? (
              <CheckCircle2
                style={{
                  width: 24,
                  height: 24,
                  color: "var(--success)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <XCircle
                style={{
                  width: 24,
                  height: 24,
                  color: "var(--danger)",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="split">
                <strong
                  style={{
                    fontSize: "0.95rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {parcel.customerName}
                </strong>
                {parcel.state === "delivered" ? (
                  <span
                    className="chip success"
                    style={{ fontSize: "0.8rem", flexShrink: 0 }}
                  >
                    {formatCurrency(parcel.codAmountAed)}
                  </span>
                ) : (
                  <span
                    className="chip danger"
                    style={{ fontSize: "0.8rem", flexShrink: 0 }}
                  >
                    Failed
                  </span>
                )}
              </div>
              <div className="muted" style={{ fontSize: "0.82rem" }}>
                {parcel.area} &middot; {formatTime(parcel.lastUpdateAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

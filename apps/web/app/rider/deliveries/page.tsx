import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { getRiderDashboardDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "parcel-delivered": { tone: "success", text: "Parcel delivered." },
    "parcel-failed": { tone: "success", text: "Parcel marked as failed." },
    "failure-reason-required": {
      tone: "warn",
      text: "Pick a reason before marking failed.",
    },
    "delivery-failed": {
      tone: "warn",
      text: "Something went wrong. Try again.",
    },
  };

export default async function RiderDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [session, params] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);
  if (!session) return null;
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

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
  const activeParcels = parcels.filter((p) => p.state === "in_transit");

  if (activeParcels.length === 0) {
    return (
      <>
        {notice ? (
          <div className={`notice ${notice.tone}`}>{notice.text}</div>
        ) : null}
        <section className="panel" style={{ padding: 20 }}>
          <div className="empty-state">
            <strong>No deliveries right now</strong>
            <span className="muted">
              Accept work from the My Work page first, or wait for your operator
              to assign parcels.
            </span>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}
      <div className="muted" style={{ fontSize: "0.88rem", marginBottom: 8 }}>
        {activeParcels.length} parcel{activeParcels.length !== 1 ? "s" : ""} to
        deliver. Tap a parcel to see full details.
      </div>

      <div className="stack">
        {activeParcels.map((parcel) => (
          <Link
            href={`/rider/parcel/${parcel.id}`}
            key={parcel.id}
            className="panel"
            style={{
              display: "block",
              padding: 16,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div className="split" style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: "1.05rem" }}>
                {parcel.customerName}
              </strong>
              <span
                className="chip warn"
                style={{ fontSize: "0.9rem", fontWeight: 600 }}
              >
                {formatCurrency(parcel.codAmountAed)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                fontSize: "0.9rem",
                marginBottom: 6,
              }}
            >
              <MapPin
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  flexShrink: 0,
                  color: "var(--primary)",
                }}
              />
              <span>
                {parcel.area} &mdash; {parcel.address}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.88rem",
              }}
            >
              <Phone
                style={{
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  color: "#64748b",
                }}
              />
              <span className="muted">{parcel.customerPhone}</span>
            </div>

            <div
              className="muted"
              style={{ fontSize: "0.82rem", marginTop: 6 }}
            >
              {parcel.itemSummary}
              {parcel.merchantName ? ` · from ${parcel.merchantName}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

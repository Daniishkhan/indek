import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Package, Store } from "lucide-react";
import { getParcelForRider } from "@indek/domain";
import { parseParcelWorkflowNotes } from "@indek/shared";
import { getCurrentSession } from "@/lib/session";
import { DeliveryActions } from "@/components/delivery-actions";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default async function RiderParcelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id: parcelId }] = await Promise.all([
    getCurrentSession(),
    params,
  ]);
  if (!session) return null;

  const parcel = await getParcelForRider(parcelId, session.user.id);

  if (!parcel) {
    return (
      <section className="panel" style={{ padding: 20 }}>
        <h2>Parcel not found</h2>
        <p className="muted">
          This parcel does not exist or is not assigned to you.
        </p>
        <Link href="/rider/deliveries" className="button secondary">
          Back to deliveries
        </Link>
      </section>
    );
  }

  const workflowNotes = parseParcelWorkflowNotes(parcel.notes);
  const isActive = parcel.state === "in_transit";
  const isDone = parcel.state === "delivered" || parcel.state === "failed";
  const fullAddress = `${parcel.area}, ${parcel.address}`;

  return (
    <>
      {/* Back link */}
      <Link
        href="/rider/deliveries"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--primary)",
          textDecoration: "none",
          fontSize: "0.9rem",
          marginBottom: 12,
        }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        Back to deliveries
      </Link>

      {/* Status banner for completed parcels */}
      {isDone ? (
        <div
          className={`notice ${parcel.state === "delivered" ? "success" : "warn"}`}
        >
          This parcel is marked as{" "}
          <strong>
            {parcel.state === "delivered" ? "delivered" : "failed"}
          </strong>
          .
        </div>
      ) : null}

      {/* Customer section */}
      <section className="panel" style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          Customer
        </div>
        <h2 style={{ margin: "0 0 12px", fontSize: "1.3rem" }}>
          {parcel.customerName}
        </h2>

        {/* Phone — big tap target */}
        <a
          href={`tel:${parcel.customerPhone}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 8,
            background: "var(--surface-muted)",
            textDecoration: "none",
            color: "var(--primary)",
            fontSize: "1rem",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          <Phone style={{ width: 20, height: 20 }} />
          {parcel.customerPhone}
        </a>

        {/* Address — tap to open maps */}
        <a
          href={mapsUrl(fullAddress)}
          rel="noopener noreferrer"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 8,
            background: "var(--surface-muted)",
            textDecoration: "none",
            color: "inherit",
            fontSize: "0.95rem",
          }}
        >
          <MapPin
            style={{
              width: 20,
              height: 20,
              marginTop: 1,
              flexShrink: 0,
              color: "var(--primary)",
            }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{parcel.area}</div>
            <div className="muted" style={{ fontSize: "0.88rem" }}>
              {parcel.address}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--primary)",
                marginTop: 4,
              }}
            >
              Open in Maps &rarr;
            </div>
          </div>
        </a>
      </section>

      {/* COD amount — big and clear */}
      <section
        className="panel"
        style={{
          padding: 20,
          textAlign: "center",
          background: "var(--surface-muted)",
        }}
      >
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 4 }}>
          Cash to collect
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 700 }}>
          {formatCurrency(parcel.codAmountAed)}
        </div>
      </section>

      {/* Parcel details */}
      <section className="panel" style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Parcel details
        </div>

        <div className="stack-tight">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.92rem",
            }}
          >
            <Package
              style={{ width: 16, height: 16, color: "#64748b", flexShrink: 0 }}
            />
            <span>{parcel.itemSummary}</span>
          </div>

          {parcel.merchantName ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.92rem",
              }}
            >
              <Store
                style={{
                  width: 16,
                  height: 16,
                  color: "#64748b",
                  flexShrink: 0,
                }}
              />
              <span>From {parcel.merchantName}</span>
            </div>
          ) : null}

          <div className="muted" style={{ fontSize: "0.82rem" }}>
            AWB: {parcel.awb}
          </div>

          {workflowNotes.customerNotes ? (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 6,
                background: "#fef9c3",
                fontSize: "0.88rem",
              }}
            >
              <strong>Note:</strong> {workflowNotes.customerNotes}
            </div>
          ) : null}
        </div>
      </section>

      {/* Actions */}
      {isActive ? (
        <section>
          <DeliveryActions
            parcelId={parcel.id}
            codAmountAed={parcel.codAmountAed}
          />
        </section>
      ) : null}
    </>
  );
}

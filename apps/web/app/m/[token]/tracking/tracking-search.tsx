"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Parcel, Merchant } from "@indek/shared";
import { MerchantParcelEditor } from "@/components/merchant-parcel-editor";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

type EnrichedParcel = Parcel & {
  chip: { tone: string; label: string };
  editable: boolean;
  showFollowUp: boolean;
};

const STATE_FILTERS = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Under review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
] as const;

export function TrackingSearch({
  parcels,
  merchant,
  updateAction,
}: {
  parcels: EnrichedParcel[];
  merchant: Merchant;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const q = query.toLowerCase().trim();
  const filtered = parcels.filter((p) => {
    if (stateFilter !== "all" && p.state !== stateFilter) return false;
    if (!q) return true;
    return (
      p.awb.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.customerPhone.includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <section className="panel stack">
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 220,
              position: "relative",
            }}
          >
            <Search
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="input"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by AWB, customer, phone, or area..."
              style={{ paddingLeft: 36 }}
              type="text"
              value={query}
            />
          </div>

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATE_FILTERS.map((f) => (
              <button
                className={`chip ${stateFilter === f.value ? "primary" : ""}`}
                key={f.value}
                onClick={() => setStateFilter(f.value)}
                style={{ cursor: "pointer", border: "none" }}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="muted" style={{ fontSize: "0.85rem" }}>
          {filtered.length} of {parcels.length} orders
        </div>
      </section>

      {filtered.length > 0 ? (
        <div className="list">
          {filtered.map((parcel) => {
            const followUp = parcel.latestFollowUp;

            return (
              <div className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.awb}</strong>
                  <span className={`chip ${parcel.chip.tone}`}>
                    {parcel.chip.label}
                  </span>
                </div>
                <div>{parcel.customerName}</div>
                <div className="muted">
                  {parcel.area} · {parcel.itemSummary} ·{" "}
                  {formatCurrency(parcel.codAmountAed)}
                </div>
                {parcel.pickupAddress ? (
                  <div className="muted">Pickup: {parcel.pickupAddress}</div>
                ) : null}
                {parcel.averageShippingChargeAed !== undefined ? (
                  <div className="muted">
                    Shipping charge:{" "}
                    {formatCurrency(parcel.averageShippingChargeAed)}
                  </div>
                ) : null}
                <div className="muted">
                  Updated {new Date(parcel.lastUpdateAt).toLocaleString()}
                </div>
                <div className="muted">Dropoff: {parcel.address}</div>

                {parcel.showFollowUp && followUp ? (
                  <div className="notice warn" style={{ marginTop: 8 }}>
                    <div className="stack-tight">
                      <div className="label">Ops needs your input</div>
                      <strong>{followUp.message}</strong>
                      <span className="muted" style={{ fontSize: "0.82rem" }}>
                        From {followUp.createdByLabel} ·{" "}
                        {new Date(followUp.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : null}

                {parcel.editable ? (
                  <MerchantParcelEditor
                    action={updateAction}
                    merchant={merchant}
                    parcel={parcel}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel empty-state">
          <strong>
            {parcels.length === 0
              ? "No delivery requests yet."
              : "No orders match your search."}
          </strong>
          <span className="muted">
            {parcels.length === 0
              ? "Create your first order from the Orders page."
              : "Try a different search term or filter."}
          </span>
        </div>
      )}
    </>
  );
}

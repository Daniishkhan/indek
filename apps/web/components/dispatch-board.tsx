"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  MapPin,
  Package,
  Search,
  Truck,
  UserCircle2,
  Wallet,
} from "lucide-react";
import type { Parcel, Rider, Manifest } from "@indek/shared";
import { assignManifestAction } from "@/app/actions";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function zoneBadge(zone: string) {
  return zone.slice(0, 2).toUpperCase();
}

export function DispatchBoard({
  parcels,
  riders,
  manifests,
}: {
  parcels: Parcel[];
  riders: Rider[];
  manifests: Manifest[];
}) {
  const [selectedParcels, setSelectedParcels] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const zones = useMemo(() => {
    const set = new Set<string>();
    parcels.forEach((p) => set.add(p.area));
    return Array.from(set).sort();
  }, [parcels]);

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      if (zoneFilter !== "all" && parcel.area !== zoneFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        parcel.awb.toLowerCase().includes(q) ||
        parcel.customerName.toLowerCase().includes(q) ||
        (parcel.merchantName ?? "").toLowerCase().includes(q) ||
        parcel.area.toLowerCase().includes(q)
      );
    });
  }, [parcels, zoneFilter, query]);

  const selectedList = useMemo(
    () => parcels.filter((p) => selectedParcels.has(p.id)),
    [parcels, selectedParcels],
  );

  const selectedCodTotal = selectedList.reduce(
    (sum, p) => sum + p.codAmountAed,
    0,
  );
  const selectedZones = useMemo(() => {
    const set = new Set<string>();
    selectedList.forEach((p) => set.add(p.area));
    return Array.from(set).sort();
  }, [selectedList]);

  function toggleParcel(id: string) {
    setSelectedParcels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedParcels((prev) => {
      const next = new Set(prev);
      filteredParcels.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedParcels(new Set());
  }

  const riderLoads = useMemo(() => {
    const map = new Map<string, Manifest>();
    manifests.forEach((m) => {
      if (!map.has(m.riderId)) map.set(m.riderId, m);
    });
    return map;
  }, [manifests]);

  const canAssign = selectedParcels.size > 0 && selectedRider !== "";

  return (
    <form action={assignManifestAction} className="dispatch-board">
      <input name="riderId" type="hidden" value={selectedRider} />
      {Array.from(selectedParcels).map((id) => (
        <input key={id} name="parcelIds" type="hidden" value={id} />
      ))}

      <div className="dispatch-queue">
        <div className="dispatch-queue-head">
          <div className="split" style={{ alignItems: "baseline" }}>
            <div>
              <div className="eyebrow">Unassigned queue</div>
              <h2 style={{ margin: 0 }}>
                {filteredParcels.length} parcel
                {filteredParcels.length === 1 ? "" : "s"}
                {zoneFilter !== "all" ? ` in ${zoneFilter}` : " waiting"}
              </h2>
            </div>
            <div className="dispatch-tools">
              <label className="dispatch-search">
                <Search />
                <input
                  className="input"
                  placeholder="Search AWB, customer, merchant"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="dispatch-zone-filter">
            <span className="dispatch-zone-label">
              <Filter style={{ width: 14, height: 14 }} />
              Zone
            </span>
            <button
              type="button"
              className={`zone-chip ${zoneFilter === "all" ? "active" : ""}`}
              onClick={() => setZoneFilter("all")}
            >
              All <span className="count">{parcels.length}</span>
            </button>
            {zones.map((zone) => {
              const count = parcels.filter((p) => p.area === zone).length;
              return (
                <button
                  key={zone}
                  type="button"
                  className={`zone-chip ${zoneFilter === zone ? "active" : ""}`}
                  onClick={() => setZoneFilter(zone)}
                >
                  {zone} <span className="count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredParcels.length > 0 ? (
          <>
            <div className="dispatch-bulk-row">
              <button
                type="button"
                className="button ghost"
                onClick={selectAllFiltered}
              >
                Select all visible
              </button>
              {selectedParcels.size > 0 ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={clearSelection}
                >
                  Clear selection ({selectedParcels.size})
                </button>
              ) : null}
            </div>
            <div className="dispatch-parcel-grid">
              {filteredParcels.map((parcel) => {
                const selected = selectedParcels.has(parcel.id);
                return (
                  <button
                    key={parcel.id}
                    type="button"
                    onClick={() => toggleParcel(parcel.id)}
                    className={`parcel-card ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                  >
                    <div className="parcel-card-head">
                      <span className="zone-badge">
                        {zoneBadge(parcel.area)}
                      </span>
                      <div className="parcel-card-meta">
                        <strong>{parcel.customerName}</strong>
                        <span className="muted">{parcel.area}</span>
                      </div>
                      <span className="parcel-card-cod">
                        {formatCurrency(parcel.codAmountAed)}
                      </span>
                    </div>
                    <div className="parcel-card-body">
                      <div className="parcel-card-line">
                        <span className="label">AWB</span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {parcel.awb}
                        </span>
                      </div>
                      <div className="parcel-card-line">
                        <span className="label">Merchant</span>
                        <span>{parcel.merchantName ?? "Merchant"}</span>
                      </div>
                      {parcel.pickupAddress ? (
                        <div className="parcel-card-route">
                          <MapPin style={{ width: 12, height: 12 }} />
                          <span className="muted">
                            {parcel.pickupAddress} → {parcel.address}
                          </span>
                        </div>
                      ) : (
                        <div className="parcel-card-route">
                          <MapPin style={{ width: 12, height: 12 }} />
                          <span className="muted">{parcel.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="parcel-card-select">
                      <span
                        className={`checkbox ${selected ? "checked" : ""}`}
                      />
                      <span>{selected ? "Selected" : "Tap to add"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>
              {parcels.length === 0
                ? "No parcels waiting for dispatch."
                : "No parcels match your filter."}
            </strong>
            <span className="muted">
              {parcels.length === 0
                ? "New merchant requests will land here immediately."
                : "Try a different zone or clear the search."}
            </span>
          </div>
        )}
      </div>

      <aside className="dispatch-assign">
        <div className="dispatch-assign-summary">
          <div className="eyebrow">Current selection</div>
          <div className="dispatch-summary-metrics">
            <div>
              <div className="label">Parcels</div>
              <div className="metric-value" style={{ margin: 0 }}>
                {selectedParcels.size}
              </div>
            </div>
            <div>
              <div className="label">COD total</div>
              <div className="metric-value" style={{ margin: 0 }}>
                {formatCurrency(selectedCodTotal)}
              </div>
            </div>
          </div>
          <div className="dispatch-summary-zones">
            <span className="label">Zones</span>
            {selectedZones.length > 0 ? (
              <div className="dispatch-zone-chips">
                {selectedZones.map((zone) => (
                  <span className="chip primary" key={zone}>
                    {zone}
                  </span>
                ))}
              </div>
            ) : (
              <span className="muted" style={{ fontSize: "0.82rem" }}>
                Select parcels to see zones
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="eyebrow">Assign to rider</div>
          <div className="dispatch-rider-list">
            {riders.length > 0 ? (
              riders.map((rider) => {
                const selected = selectedRider === rider.id;
                const existing = riderLoads.get(rider.id);
                const disabled = rider.status === "off_shift";
                return (
                  <button
                    key={rider.id}
                    type="button"
                    className={`rider-card ${selected ? "selected" : ""} ${
                      disabled ? "disabled" : ""
                    }`}
                    aria-pressed={selected}
                    onClick={() => !disabled && setSelectedRider(rider.id)}
                  >
                    <div className="rider-card-top">
                      <span className="rider-avatar">
                        <UserCircle2 />
                      </span>
                      <div className="rider-meta">
                        <strong>{rider.name}</strong>
                        <span className="muted">{rider.zone}</span>
                      </div>
                      <span
                        className={`status-dot ${
                          rider.status === "available"
                            ? "success"
                            : rider.status === "off_shift"
                              ? "danger"
                              : "warn"
                        }`}
                      >
                        {rider.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="rider-card-stats">
                      <div>
                        <Package style={{ width: 12, height: 12 }} />
                        <span>{rider.parcelsInCustody} in custody</span>
                      </div>
                      <div>
                        <Wallet style={{ width: 12, height: 12 }} />
                        <span>{formatCurrency(rider.cashHeldAed)} held</span>
                      </div>
                      {existing ? (
                        <div>
                          <Truck style={{ width: 12, height: 12 }} />
                          <span>
                            {existing.accepted ? "Accepted" : "Awaiting accept"}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <span className={`radio ${selected ? "checked" : ""}`} />
                  </button>
                );
              })
            ) : (
              <div className="empty-state">
                <strong>No riders on the roster yet.</strong>
                <span className="muted">
                  Add riders from the riders page before creating manifests.
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          className="button"
          type="submit"
          disabled={!canAssign}
          style={{ width: "100%" }}
        >
          Create manifest
          {selectedParcels.size > 0
            ? ` · ${selectedParcels.size} parcel${selectedParcels.size === 1 ? "" : "s"}`
            : ""}
        </button>
        {!canAssign ? (
          <span
            className="muted"
            style={{ fontSize: "0.82rem", textAlign: "center" }}
          >
            {selectedParcels.size === 0
              ? "Select parcels from the queue"
              : "Pick a rider to complete the manifest"}
          </span>
        ) : null}
      </aside>
    </form>
  );
}

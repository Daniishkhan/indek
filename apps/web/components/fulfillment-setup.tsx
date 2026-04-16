"use client";

import { useState } from "react";
import { MapPin, Warehouse } from "lucide-react";
import type { Merchant, FulfillmentMode } from "@indek/shared";

const DROPOFF_HUB_ADDRESS =
  "Indek Hub, Al Quoz Industrial Area 3, Warehouse 12, Dubai";

export function FulfillmentSetup({
  action,
  merchant,
}: {
  action: (formData: FormData) => void | Promise<void>;
  merchant: Merchant;
}) {
  const [mode, setMode] = useState<FulfillmentMode>(merchant.fulfillmentMode);
  const [address, setAddress] = useState(merchant.pickupAddress ?? "");

  const modeChanged = mode !== merchant.fulfillmentMode;
  const addressChanged =
    mode === "pickup" && address.trim() !== (merchant.pickupAddress ?? "");
  const canSubmit =
    (modeChanged || addressChanged) &&
    (mode === "dropoff" || address.trim().length > 0);

  return (
    <form action={action} className="stack">
      <input name="token" type="hidden" value={merchant.token} />
      <input name="fulfillmentMode" type="hidden" value={mode} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          className={`panel ${mode === "pickup" ? "" : ""}`}
          onClick={() => setMode("pickup")}
          type="button"
          style={{
            cursor: "pointer",
            textAlign: "left",
            padding: 16,
            border: `2px solid ${mode === "pickup" ? "var(--primary)" : "var(--border)"}`,
            background:
              mode === "pickup" ? "var(--primary-soft)" : "var(--surface)",
            borderRadius: "var(--radius-md)",
            transition: "border-color 120ms ease, background 120ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <MapPin
              style={{
                width: 18,
                height: 18,
                color: mode === "pickup" ? "var(--primary)" : "var(--muted)",
              }}
            />
            <strong
              style={{
                fontSize: "0.9rem",
                color:
                  mode === "pickup" ? "var(--primary)" : "var(--foreground)",
              }}
            >
              Rider pickup
            </strong>
          </div>
          <span
            className="muted"
            style={{ fontSize: "0.82rem", lineHeight: 1.4 }}
          >
            A rider comes to your location to collect parcels.
          </span>
        </button>

        <button
          className={`panel`}
          onClick={() => setMode("dropoff")}
          type="button"
          style={{
            cursor: "pointer",
            textAlign: "left",
            padding: 16,
            border: `2px solid ${mode === "dropoff" ? "var(--primary)" : "var(--border)"}`,
            background:
              mode === "dropoff" ? "var(--primary-soft)" : "var(--surface)",
            borderRadius: "var(--radius-md)",
            transition: "border-color 120ms ease, background 120ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Warehouse
              style={{
                width: 18,
                height: 18,
                color: mode === "dropoff" ? "var(--primary)" : "var(--muted)",
              }}
            />
            <strong
              style={{
                fontSize: "0.9rem",
                color:
                  mode === "dropoff" ? "var(--primary)" : "var(--foreground)",
              }}
            >
              Drop-off at hub
            </strong>
          </div>
          <span
            className="muted"
            style={{ fontSize: "0.82rem", lineHeight: 1.4 }}
          >
            You bring parcels to our location.
          </span>
        </button>
      </div>

      {mode === "pickup" ? (
        <>
          {merchant.pickupAddress && merchant.fulfillmentMode === "pickup" ? (
            <div
              className="estimate-card"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <MapPin
                style={{
                  width: 20,
                  height: 20,
                  color: "var(--primary)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="label">Current pickup address</div>
                <div style={{ fontWeight: 600 }}>{merchant.pickupAddress}</div>
              </div>
            </div>
          ) : null}

          <label className="form-field">
            <span className="label">
              {merchant.pickupAddress ? "Update address" : "Pickup address"}
            </span>
            <textarea
              className="textarea"
              name="pickupAddress"
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Al Quoz Industrial Area 3, Warehouse 7, Gate 2"
              required
              rows={2}
              value={address}
            />
          </label>
        </>
      ) : (
        <div
          className="estimate-card"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Warehouse
            style={{
              width: 20,
              height: 20,
              color: "var(--primary)",
              flexShrink: 0,
            }}
          />
          <div>
            <div className="label">Drop-off location</div>
            <div style={{ fontWeight: 600 }}>{DROPOFF_HUB_ADDRESS}</div>
            <div
              className="muted"
              style={{ fontSize: "0.82rem", marginTop: 4 }}
            >
              Bring your parcels here. Operating hours: 8 AM – 10 PM daily.
            </div>
          </div>
        </div>
      )}

      <button className="button" disabled={!canSubmit} type="submit">
        Save fulfillment setup
      </button>
    </form>
  );
}

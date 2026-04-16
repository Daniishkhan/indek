"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import {
  recordParcelDeliveredAction,
  recordParcelFailedAction,
} from "@/app/actions";
import type { FailureReason } from "@indek/shared";

const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  customer_not_home: "Not home",
  customer_refused: "Refused delivery",
  reschedule_requested: "Asked to reschedule",
  other: "Other reason",
};

const failureReasons: FailureReason[] = [
  "customer_not_home",
  "customer_refused",
  "reschedule_requested",
  "other",
];

export function DeliveryActions({
  parcelId,
  codAmountAed,
}: {
  parcelId: string;
  codAmountAed: number;
}) {
  const [mode, setMode] = useState<"idle" | "deliver" | "fail">("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliverFormRef = useRef<HTMLFormElement>(null);
  const failFormRef = useRef<HTMLFormElement>(null);

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function handleDeliverSubmit() {
    setSubmitting(true);
    deliverFormRef.current?.requestSubmit();
  }

  function handleFailSubmit() {
    setSubmitting(true);
    failFormRef.current?.requestSubmit();
  }

  if (mode === "idle") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="button"
          onClick={() => setMode("deliver")}
          style={{
            width: "100%",
            height: 56,
            fontSize: "1.05rem",
            gap: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          type="button"
        >
          <CheckCircle2 style={{ width: 22, height: 22 }} />
          Delivered
        </button>
        <button
          className="button secondary"
          onClick={() => setMode("fail")}
          style={{
            width: "100%",
            height: 48,
            fontSize: "1rem",
            gap: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          type="button"
        >
          <XCircle style={{ width: 20, height: 20 }} />
          Could Not Deliver
        </button>
      </div>
    );
  }

  if (mode === "deliver") {
    return (
      <div className="panel stack" style={{ padding: 16 }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Confirm delivery</h3>

        {/* Photo capture */}
        <div>
          <input
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            style={{ display: "none" }}
            type="file"
          />
          {photoPreview ? (
            <div style={{ position: "relative" }}>
              <img
                alt="Delivery proof"
                src={photoPreview}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  maxHeight: 200,
                  objectFit: "cover",
                }}
              />
              <button
                className="button secondary"
                onClick={() => {
                  setPhotoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  padding: "4px 10px",
                  fontSize: "0.82rem",
                }}
                type="button"
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              className="button secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                height: 56,
                fontSize: "1rem",
                gap: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              type="button"
            >
              <Camera style={{ width: 20, height: 20 }} />
              Take Photo Proof
            </button>
          )}
        </div>

        <div
          className="muted"
          style={{
            fontSize: "0.88rem",
            padding: "8px 12px",
            background: "var(--surface-muted)",
            borderRadius: 6,
          }}
        >
          Collect{" "}
          <strong>
            AED{" "}
            {codAmountAed.toLocaleString("en-AE", {
              maximumFractionDigits: 0,
            })}
          </strong>{" "}
          cash from the customer
        </div>

        <form ref={deliverFormRef} action={recordParcelDeliveredAction}>
          <input name="parcelId" type="hidden" value={parcelId} />
          <button
            className="button"
            disabled={submitting}
            onClick={handleDeliverSubmit}
            style={{
              width: "100%",
              height: 52,
              fontSize: "1rem",
              gap: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            type="button"
          >
            <CheckCircle2 style={{ width: 20, height: 20 }} />
            {submitting ? "Saving..." : "Confirm Delivered"}
          </button>
        </form>

        <button
          className="button ghost"
          onClick={() => {
            setMode("idle");
            setPhotoPreview(null);
          }}
          style={{ width: "100%", fontSize: "0.9rem" }}
          type="button"
        >
          Go back
        </button>
      </div>
    );
  }

  // mode === "fail"
  return (
    <div className="panel stack" style={{ padding: 16 }}>
      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
        Why could you not deliver?
      </h3>

      <form ref={failFormRef} action={recordParcelFailedAction}>
        <input name="parcelId" type="hidden" value={parcelId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {failureReasons.map((reason) => (
            <label
              key={reason}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              <input
                name="reason"
                required
                style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                type="radio"
                value={reason}
              />
              {FAILURE_REASON_LABELS[reason]}
            </label>
          ))}
        </div>

        <button
          className="button secondary"
          disabled={submitting}
          onClick={handleFailSubmit}
          style={{
            width: "100%",
            height: 48,
            fontSize: "1rem",
            marginTop: 12,
            gap: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          type="button"
        >
          <XCircle style={{ width: 18, height: 18 }} />
          {submitting ? "Saving..." : "Mark as Failed"}
        </button>
      </form>

      <button
        className="button ghost"
        onClick={() => setMode("idle")}
        style={{ width: "100%", fontSize: "0.9rem" }}
        type="button"
      >
        Go back
      </button>
    </div>
  );
}

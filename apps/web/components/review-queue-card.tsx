"use client";

import { useMemo, useState } from "react";
import {
  requestReviewChecklistFields,
  type Parcel,
  type RequestReviewChecklist,
  type RequestReviewChecklistKey,
} from "@indek/shared";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.round((now - then) / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

const REVIEW_STATE_LABEL: Record<Parcel["reviewState"], string> = {
  under_review: "Under review",
  needs_clarification: "Needs clarification",
  on_hold: "On hold",
  dispatch_ready: "Dispatch ready",
};

const REVIEW_STATE_TONE: Record<Parcel["reviewState"], string> = {
  under_review: "warn",
  needs_clarification: "primary",
  on_hold: "danger",
  dispatch_ready: "success",
};

type ActionHandler = (formData: FormData) => void | Promise<void>;

export function ReviewQueueCard({
  parcel,
  approveAction,
  followUpAction,
  holdAction,
}: {
  parcel: Parcel;
  approveAction: ActionHandler;
  followUpAction: ActionHandler;
  holdAction: ActionHandler;
}) {
  const initialChecklist = useMemo(() => {
    const base: RequestReviewChecklist = {
      addressConfirmed: false,
      contactConfirmed: false,
      pickupConfirmed: false,
      codConfirmed: false,
      riskChecked: false,
    };
    return { ...base, ...(parcel.reviewChecklist ?? {}) };
  }, [parcel.reviewChecklist]);

  const [deliveryFee, setDeliveryFee] = useState(
    parcel.deliveryFeeAed != null ? String(parcel.deliveryFeeAed) : "",
  );
  const [checklist, setChecklist] =
    useState<RequestReviewChecklist>(initialChecklist);
  const [reviewNote, setReviewNote] = useState(parcel.reviewNote ?? "");
  const [message, setMessage] = useState(
    parcel.latestFollowUp?.status === "open"
      ? parcel.latestFollowUp.message
      : "",
  );

  const allChecked = requestReviewChecklistFields.every(
    ({ key }) => checklist[key],
  );
  const feeValid =
    deliveryFee.trim() !== "" &&
    !isNaN(parseFloat(deliveryFee)) &&
    parseFloat(deliveryFee) >= 0;
  const canFollowUp = message.trim().length > 0;
  const canHold = message.trim().length > 0 || reviewNote.trim().length > 0;

  const toggleChecklist = (key: RequestReviewChecklistKey) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openFollowUp =
    parcel.latestFollowUp?.status === "open" ? parcel.latestFollowUp : null;

  return (
    <form action={approveAction} className="panel stack review-card">
      <input name="parcelId" type="hidden" value={parcel.id} />

      <header className="split">
        <div className="stack-tight">
          <div className="eyebrow">
            {parcel.merchantName ?? "Merchant"} · {parcel.awb}
          </div>
          <strong style={{ fontSize: "1.05rem" }}>{parcel.customerName}</strong>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Submitted {formatRelative(parcel.createdAt)} ·{" "}
            {parcel.area || "Area TBD"}
          </span>
        </div>
        <span className={`chip ${REVIEW_STATE_TONE[parcel.reviewState]}`}>
          {REVIEW_STATE_LABEL[parcel.reviewState]}
        </span>
      </header>

      <div className="list">
        <div className="list-item">
          <div className="split">
            <span className="label">Customer</span>
            <span className="value">{parcel.customerPhone}</span>
          </div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            Drop: {parcel.address}
          </div>
          {parcel.pickupAddress ? (
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              Pickup: {parcel.pickupAddress}
            </div>
          ) : null}
        </div>
        <div className="list-item">
          <div className="split">
            <span className="label">Item</span>
            <span className="value">{parcel.itemSummary}</span>
          </div>
          <div className="split">
            <span className="label">COD</span>
            <span className="value">{formatCurrency(parcel.codAmountAed)}</span>
          </div>
          {typeof parcel.averageShippingChargeAed === "number" ? (
            <div className="split">
              <span className="label">Avg shipping</span>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                {formatCurrency(parcel.averageShippingChargeAed)}
              </span>
            </div>
          ) : null}
          {parcel.notes ? (
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              Notes: {parcel.notes}
            </div>
          ) : null}
        </div>
      </div>

      {openFollowUp ? (
        <div className="notice warn">
          <div className="stack-tight">
            <div className="label">Open follow-up</div>
            <strong>{openFollowUp.message}</strong>
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              Sent by {openFollowUp.createdByLabel} ·{" "}
              {formatRelative(openFollowUp.createdAt)}
            </span>
          </div>
        </div>
      ) : null}

      {parcel.reviewNote ? (
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          Last review note: {parcel.reviewNote}
        </div>
      ) : null}

      <label className="form-field">
        <span className="label">Delivery fee (AED)</span>
        <input
          className="input"
          inputMode="decimal"
          name="deliveryFeeAed"
          onChange={(event) => setDeliveryFee(event.target.value)}
          placeholder="e.g. 15.00"
          step="0.01"
          type="number"
          min="0"
          value={deliveryFee}
        />
        <span className="muted" style={{ fontSize: "0.78rem" }}>
          Set the delivery fee for this order before approving.
        </span>
      </label>

      <fieldset className="form-section" style={{ border: 0, padding: 0 }}>
        <div className="form-section-head">
          <span className="section-title">Due-diligence checklist</span>
          <span className="section-hint">
            All must be ticked to approve for dispatch.
          </span>
        </div>
        <div className="stack-tight">
          {requestReviewChecklistFields.map((field) => (
            <label
              key={field.key}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                fontSize: "0.9rem",
              }}
            >
              <input
                checked={checklist[field.key]}
                name={field.key}
                onChange={() => toggleChecklist(field.key)}
                type="checkbox"
                value="on"
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="form-field">
        <span className="label">Internal review note</span>
        <textarea
          className="textarea"
          name="reviewNote"
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="What did you check, and any caveats for dispatch."
          rows={2}
          value={reviewNote}
        />
      </label>

      <label className="form-field">
        <span className="label">Merchant-facing message</span>
        <textarea
          className="textarea"
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. Can you confirm the building name and add a contact for the concierge?"
          rows={2}
          value={message}
        />
        <span className="muted" style={{ fontSize: "0.78rem" }}>
          Shown to the merchant when sending a follow-up or holding the request.
        </span>
      </label>

      <div
        className="split"
        style={{ gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}
      >
        <button
          className="button ghost"
          disabled={!canHold}
          formAction={holdAction}
          type="submit"
        >
          Put on hold
        </button>
        <button
          className="button secondary"
          disabled={!canFollowUp}
          formAction={followUpAction}
          type="submit"
        >
          Send follow-up
        </button>
        <button
          className="button"
          disabled={!allChecked || !feeValid}
          type="submit"
        >
          Approve for dispatch
        </button>
      </div>
    </form>
  );
}

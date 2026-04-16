"use client";

import { useState } from "react";
import {
  estimateAverageShippingCharge,
  type Merchant,
  type Parcel,
} from "@indek/shared";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export function MerchantParcelEditor({
  action,
  merchant,
  parcel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  merchant: Merchant;
  parcel: Parcel;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(parcel.customerName);
  const [customerPhone, setCustomerPhone] = useState(parcel.customerPhone);
  const [itemSummary, setItemSummary] = useState(parcel.itemSummary);
  const [area, setArea] = useState(parcel.area);
  const [address, setAddress] = useState(parcel.address);
  const [pickupAddress, setPickupAddress] = useState(
    parcel.pickupAddress ?? "",
  );
  const [notes, setNotes] = useState(parcel.notes ?? "");
  const [codAmountAed, setCodAmountAed] = useState(
    parcel.codAmountAed.toFixed(2),
  );

  const quote = estimateAverageShippingCharge({
    baseFeeAed: merchant.deliveryFeeAed,
    pickupAddress,
    deliveryArea: area,
    deliveryAddress: address,
  });

  if (!isEditing) {
    return (
      <button
        className="button ghost"
        onClick={() => setIsEditing(true)}
        style={{ width: "fit-content" }}
        type="button"
      >
        Update this request
      </button>
    );
  }

  return (
    <form action={action} className="stack">
      <input name="token" type="hidden" value={merchant.token} />
      <input name="parcelId" type="hidden" value={parcel.id} />
      <input
        name="averageShippingChargeAed"
        type="hidden"
        value={quote.averageChargeAed.toFixed(2)}
      />

      <div className="estimate-card">
        <div className="split">
          <div>
            <div className="label">Updated shipping charge</div>
            <div className="metric-value">
              {formatCurrency(quote.averageChargeAed)}
            </div>
          </div>
          <span className="chip">{quote.bandLabel}</span>
        </div>
        <p>{quote.summary}</p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span className="label">Customer name</span>
          <input
            className="input"
            name="customerName"
            onChange={(event) => setCustomerName(event.target.value)}
            required
            value={customerName}
          />
        </label>
        <label className="form-field">
          <span className="label">Customer phone</span>
          <input
            className="input"
            name="customerPhone"
            onChange={(event) => setCustomerPhone(event.target.value)}
            required
            value={customerPhone}
          />
        </label>
        <label className="form-field">
          <span className="label">Delivery area</span>
          <input
            className="input"
            name="area"
            onChange={(event) => setArea(event.target.value)}
            required
            value={area}
          />
        </label>
        <label className="form-field">
          <span className="label">COD amount (AED)</span>
          <input
            className="input"
            min="0"
            name="codAmountAed"
            onChange={(event) => setCodAmountAed(event.target.value)}
            step="0.01"
            type="number"
            value={codAmountAed}
          />
        </label>
        <label className="form-field">
          <span className="label">Item summary</span>
          <input
            className="input"
            name="itemSummary"
            onChange={(event) => setItemSummary(event.target.value)}
            required
            value={itemSummary}
          />
        </label>
      </div>

      <label className="form-field">
        <span className="label">Pickup address</span>
        <textarea
          className="textarea"
          name="pickupAddress"
          onChange={(event) => setPickupAddress(event.target.value)}
          required
          value={pickupAddress}
        />
      </label>

      <label className="form-field">
        <span className="label">Delivery address</span>
        <textarea
          className="textarea"
          name="address"
          onChange={(event) => setAddress(event.target.value)}
          required
          value={address}
        />
      </label>

      <label className="form-field">
        <span className="label">Notes for ops / rider</span>
        <textarea
          className="textarea"
          name="notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add context that answers the ops follow-up, if any."
          value={notes}
        />
      </label>

      <div className="split" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button
          className="button ghost"
          onClick={() => setIsEditing(false)}
          type="button"
        >
          Cancel
        </button>
        <button className="button" type="submit">
          Submit updates
        </button>
      </div>
    </form>
  );
}

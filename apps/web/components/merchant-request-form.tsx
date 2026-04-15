"use client";

import { useState } from "react";
import { estimateAverageShippingCharge, type Merchant } from "@indek/shared";

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export function MerchantRequestForm({
  action,
  merchant,
}: {
  action: (formData: FormData) => void | Promise<void>;
  merchant: Merchant;
}) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const quote = estimateAverageShippingCharge({
    baseFeeAed: merchant.deliveryFeeAed,
    pickupAddress,
    deliveryArea,
    deliveryAddress,
  });
  const hasAddressInputs =
    pickupAddress.trim().length > 0 && deliveryAddress.trim().length > 0;

  return (
    <form action={action} className="stack">
      <input name="token" type="hidden" value={merchant.token} />
      <input
        name="averageShippingChargeAed"
        type="hidden"
        value={quote.averageChargeAed.toFixed(2)}
      />

      <div className="estimate-card">
        <div className="split">
          <div>
            <div className="label">Average shipping charge</div>
            <div className="metric-value">
              {formatCurrency(quote.averageChargeAed)}
            </div>
          </div>
          <span className="chip">{quote.bandLabel}</span>
        </div>
        <p>
          {hasAddressInputs
            ? quote.summary
            : "Enter both pickup and delivery details to see the average shipping charge before you submit."}
        </p>
        <div className="muted">
          Ops sees this request in-app right after submission and can assign it
          from the dispatch board. No separate push or email is sent in this
          MVP.
        </div>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span className="label">Customer name</span>
          <input
            className="input"
            name="customerName"
            placeholder="Maha Saeed"
            required
          />
        </label>
        <label className="form-field">
          <span className="label">Customer phone</span>
          <input
            className="input"
            name="customerPhone"
            placeholder="+971 50 111 2233"
            required
          />
        </label>
        <label className="form-field">
          <span className="label">Delivery area</span>
          <input
            className="input"
            name="area"
            onChange={(event) => setDeliveryArea(event.target.value)}
            placeholder="JVC"
            required
            value={deliveryArea}
          />
        </label>
        <label className="form-field">
          <span className="label">COD amount</span>
          <input
            className="input"
            defaultValue="0"
            min="0"
            name="codAmountAed"
            step="0.01"
            type="number"
          />
        </label>
        <label className="form-field">
          <span className="label">Item summary</span>
          <input
            className="input"
            name="itemSummary"
            placeholder="Dessert box"
            required
          />
        </label>
      </div>

      <label className="form-field">
        <span className="label">Pickup address</span>
        <textarea
          className="textarea"
          name="pickupAddress"
          onChange={(event) => setPickupAddress(event.target.value)}
          placeholder="Bloom Boutique, Al Quoz industrial area 3, warehouse gate 2"
          required
          value={pickupAddress}
        />
      </label>

      <label className="form-field">
        <span className="label">Delivery address</span>
        <textarea
          className="textarea"
          name="address"
          onChange={(event) => setDeliveryAddress(event.target.value)}
          placeholder="Belgravia Heights, Tower B, apt 307"
          required
          value={deliveryAddress}
        />
      </label>

      <label className="form-field">
        <span className="label">Notes</span>
        <textarea
          className="textarea"
          name="notes"
          placeholder="Call before arrival or leave with reception."
        />
      </label>

      <button className="button" type="submit">
        Submit delivery request
      </button>
    </form>
  );
}

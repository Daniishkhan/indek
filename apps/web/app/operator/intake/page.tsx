import Link from "next/link";
import { getOperatorIntakeData } from "@indek/domain";
import {
  createMerchantAction,
  createOperatorParcelAction,
  createRiderAction,
} from "@/app/actions";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "merchant-created": {
      tone: "success",
      text: "Merchant created. Their request portal is ready to share.",
    },
    "merchant-missing-name": {
      tone: "warn",
      text: "Merchant name is required before saving the record.",
    },
    "rider-created": {
      tone: "success",
      text: "Rider added to the roster.",
    },
    "rider-missing-fields": {
      tone: "warn",
      text: "Rider name and zone are both required.",
    },
    "order-created": {
      tone: "success",
      text: "Parcel request created and added to the unassigned queue.",
    },
    "order-missing-merchant": {
      tone: "warn",
      text: "Pick a merchant before creating an intake order.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ merchants, queue, recentParcels, riders }, params] =
    await Promise.all([getOperatorIntakeData(), searchParams]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <div className="eyebrow">Journey 1</div>
          <h2>Operator intake desk</h2>
          <p>
            This is the local MVP workbench: create the merchant record, create
            the rider roster, and capture delivery requests that should appear
            on the dispatch board immediately.
          </p>
        </div>

        {notice ? (
          <div className={`notice ${notice.tone}`}>{notice.text}</div>
        ) : null}
      </section>

      <section className="two-col">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Merchant setup</div>
            <h2>Create a merchant customer</h2>
          </div>
          <form action={createMerchantAction} className="stack">
            <div className="form-grid">
              <label className="form-field">
                <span className="label">Merchant name</span>
                <input
                  className="input"
                  name="name"
                  placeholder="Bloom Boutique"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Remittance cycle</span>
                <select
                  className="select"
                  name="remittanceCycle"
                  defaultValue="weekly"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="form-field">
                <span className="label">Proof requirement</span>
                <select
                  className="select"
                  name="proofRequirement"
                  defaultValue="photo"
                >
                  <option value="photo">Photo</option>
                  <option value="otp">OTP</option>
                  <option value="photo+otp">Photo + OTP</option>
                </select>
              </label>
              <label className="form-field">
                <span className="label">COD fee percent</span>
                <input
                  className="input"
                  defaultValue="0.05"
                  min="0"
                  name="codFeePercent"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="label">Delivery fee</span>
                <input
                  className="input"
                  defaultValue="15"
                  min="0"
                  name="deliveryFeeAed"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="label">Dispute window days</span>
                <input
                  className="input"
                  defaultValue="7"
                  min="1"
                  name="disputeWindowDays"
                  step="1"
                  type="number"
                />
              </label>
            </div>
            <button className="button" type="submit">
              Create merchant
            </button>
          </form>
        </article>

        <article className="panel stack">
          <div>
            <div className="eyebrow">Rider setup</div>
            <h2>Add a rider to the roster</h2>
          </div>
          <form action={createRiderAction} className="stack">
            <div className="form-grid">
              <label className="form-field">
                <span className="label">Rider name</span>
                <input
                  className="input"
                  name="name"
                  placeholder="Hassan Ali"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Zone</span>
                <input
                  className="input"
                  name="zone"
                  placeholder="Dubai Marina"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Status</span>
                <select
                  className="select"
                  defaultValue="available"
                  name="status"
                >
                  <option value="available">Available</option>
                  <option value="on_shift">On shift</option>
                  <option value="returning">Returning</option>
                  <option value="off_shift">Off shift</option>
                </select>
              </label>
              <label className="form-field">
                <span className="label">Personal float</span>
                <input
                  className="input"
                  defaultValue="100"
                  min="0"
                  name="personalFloatAed"
                  step="0.01"
                  type="number"
                />
              </label>
            </div>
            <button className="button" type="submit">
              Add rider
            </button>
          </form>
        </article>
      </section>

      <section className="grid">
        <article className="panel stack">
          <div>
            <div className="eyebrow">Manual intake</div>
            <h2>Create a parcel request from ops</h2>
            <p>
              Use this when the merchant sends a WhatsApp message or spreadsheet
              instead of using their portal directly. Capture both pickup and
              delivery details so the request matches the merchant-side
              workflow.
            </p>
          </div>

          <form action={createOperatorParcelAction} className="stack">
            <div className="form-grid">
              <label className="form-field">
                <span className="label">Merchant</span>
                <select className="select" name="merchantId" required>
                  <option value="">Select merchant</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="label">Customer name</span>
                <input
                  className="input"
                  name="customerName"
                  placeholder="Rania Tariq"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Phone</span>
                <input
                  className="input"
                  name="customerPhone"
                  placeholder="+971 52 300 9011"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Delivery area</span>
                <input
                  className="input"
                  name="area"
                  placeholder="Business Bay"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Item summary</span>
                <input
                  className="input"
                  name="itemSummary"
                  placeholder="Abaya set"
                  required
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
            </div>

            <label className="form-field">
              <span className="label">Pickup address</span>
              <textarea
                className="textarea"
                name="pickupAddress"
                placeholder="Bloom Boutique, Al Quoz industrial area 3, warehouse gate 2"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Delivery address</span>
              <textarea
                className="textarea"
                name="address"
                placeholder="Executive Towers, podium level, apt 1804"
                required
              />
            </label>

            <label className="form-field">
              <span className="label">Notes</span>
              <textarea
                className="textarea"
                name="notes"
                placeholder="Call before arrival, leave with reception, cash must be exact."
              />
            </label>

            <button
              className="button"
              disabled={merchants.length === 0}
              type="submit"
            >
              Create parcel request
            </button>

            {merchants.length === 0 ? (
              <div className="note">
                Create a merchant record first so the request has a customer
                owner.
              </div>
            ) : null}
          </form>
        </article>

        <aside className="panel stack">
          <div>
            <div className="eyebrow">Portal links</div>
            <h2>Merchant request pages</h2>
          </div>

          {merchants.length > 0 ? (
            <div className="list">
              {merchants.map((merchant) => (
                <Link
                  className="list-item interactive-card"
                  href={`/m/${merchant.token}`}
                  key={merchant.id}
                >
                  <div className="split">
                    <strong>{merchant.name}</strong>
                    <span className="chip">{merchant.proofRequirement}</span>
                  </div>
                  <div className="muted">
                    Request orders and check status without operator re-entry.
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No merchants yet.</strong>
              <span className="muted">
                The first merchant you create will appear here with a shareable
                request link.
              </span>
            </div>
          )}

          <div className="stack">
            <div>
              <div className="eyebrow">Queue preview</div>
              <h3 style={{ margin: 0 }}>Waiting to assign</h3>
            </div>
            {queue.length > 0 ? (
              <div className="list">
                {queue.slice(0, 5).map((parcel) => (
                  <div className="list-item" key={parcel.id}>
                    <div className="split">
                      <strong>{parcel.awb}</strong>
                      <span className="chip warn">
                        {formatCurrency(parcel.codAmountAed)}
                      </span>
                    </div>
                    <div>{parcel.customerName}</div>
                    <div className="muted">
                      {parcel.merchantName ?? "Merchant"} · {parcel.area}
                    </div>
                    {parcel.pickupAddress ? (
                      <div className="muted">
                        Pickup: {parcel.pickupAddress}
                      </div>
                    ) : null}
                    {parcel.averageShippingChargeAed !== undefined ? (
                      <div className="muted">
                        Average shipping charge:{" "}
                        {formatCurrency(parcel.averageShippingChargeAed)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>The queue is clear.</strong>
                <span className="muted">
                  New merchant portal requests will show up here as soon as they
                  are submitted.
                </span>
              </div>
            )}
          </div>

          <div className="stack">
            <div>
              <div className="eyebrow">Roster</div>
              <h3 style={{ margin: 0 }}>Riders ready for manifests</h3>
            </div>
            {riders.length > 0 ? (
              <div className="list">
                {riders.slice(0, 5).map((rider) => (
                  <div className="list-item" key={rider.id}>
                    <div className="split">
                      <strong>{rider.name}</strong>
                      <span className="chip">
                        {rider.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="muted">
                      {rider.zone} · {rider.parcelsInCustody} in custody
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No riders on the roster yet.</strong>
                <span className="muted">
                  Add at least one rider before moving to dispatch.
                </span>
              </div>
            )}
          </div>

          {recentParcels.length > 0 ? (
            <div className="stack">
              <div>
                <div className="eyebrow">Latest intake</div>
                <h3 style={{ margin: 0 }}>Recent requests</h3>
              </div>
              <div className="list">
                {recentParcels.map((parcel) => (
                  <div className="list-item" key={parcel.id}>
                    <div className="split">
                      <strong>{parcel.awb}</strong>
                      <span className="chip">
                        {parcel.state.replace("_", " ")}
                      </span>
                    </div>
                    <div>{parcel.customerName}</div>
                    <div className="muted">{parcel.address}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

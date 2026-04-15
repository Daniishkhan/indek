import Link from "next/link";
import { Building2, ExternalLink, Percent, Receipt } from "lucide-react";
import { listMerchants, listParcels } from "@indek/domain";
import { createMerchantAction } from "@/app/actions";

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
  };

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

export default async function OperatorMerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [merchants, allParcels, params] = await Promise.all([
    listMerchants(),
    listParcels(),
    searchParams,
  ]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  const avgDeliveryFee = merchants.length
    ? merchants.reduce((sum, m) => sum + m.deliveryFeeAed, 0) / merchants.length
    : 0;
  const avgCodFeePercent = merchants.length
    ? merchants.reduce((sum, m) => sum + m.codFeePercent, 0) / merchants.length
    : 0;

  const parcelCountByMerchant = new Map<string, number>();
  for (const p of allParcels) {
    parcelCountByMerchant.set(
      p.merchantId,
      (parcelCountByMerchant.get(p.merchantId) ?? 0) + 1,
    );
  }

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Merchants</span>
            <span className="kpi-icon">
              <Building2 />
            </span>
          </div>
          <div className="kpi-value">{merchants.length}</div>
          <div className="kpi-foot">
            <span>On the platform</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Avg delivery fee</span>
            <span className="kpi-icon cyan">
              <Receipt />
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(avgDeliveryFee)}</div>
          <div className="kpi-foot">
            <span>Per parcel, across merchants</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Avg COD fee</span>
            <span className="kpi-icon amber">
              <Percent />
            </span>
          </div>
          <div className="kpi-value">
            {(avgCodFeePercent * 100).toFixed(1)}%
          </div>
          <div className="kpi-foot">
            <span>Of collected cash</span>
          </div>
        </article>
      </section>

      <section className="two-col">
        <article className="panel stack">
          <div>
            <div className="eyebrow">New merchant</div>
            <h2 style={{ margin: 0 }}>Create a merchant customer</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Onboard a merchant with their fees, proof requirement, and
              remittance cycle. A tokenized request portal is provisioned
              automatically.
            </p>
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
                <span className="label">Delivery fee (AED)</span>
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
                <span className="label">Dispute window (days)</span>
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

        <aside className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Roster</div>
              <h2 style={{ margin: 0 }}>Merchants & portal links</h2>
            </div>
            <span className="chip">{merchants.length}</span>
          </div>

          {merchants.length > 0 ? (
            <div className="list">
              {merchants.map((merchant) => {
                const parcelCount = parcelCountByMerchant.get(merchant.id) ?? 0;
                return (
                  <div className="list-item" key={merchant.id}>
                    <div className="split">
                      <strong>{merchant.name}</strong>
                      <span className="chip">{merchant.proofRequirement}</span>
                    </div>
                    <div
                      className="muted"
                      style={{ fontSize: "0.85rem", marginTop: 4 }}
                    >
                      {merchant.remittanceCycle} remit ·{" "}
                      {formatCurrency(merchant.deliveryFeeAed)} fee ·{" "}
                      {(merchant.codFeePercent * 100).toFixed(1)}% COD
                    </div>
                    <div
                      className="split"
                      style={{ marginTop: 10, alignItems: "center" }}
                    >
                      <span className="muted" style={{ fontSize: "0.82rem" }}>
                        {parcelCount} parcel{parcelCount === 1 ? "" : "s"}{" "}
                        lifetime
                      </span>
                      <Link
                        className="button ghost"
                        href={`/m/${merchant.token}`}
                      >
                        <ExternalLink
                          style={{ width: 14, height: 14, marginRight: 6 }}
                        />
                        Open portal
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No merchants on the platform yet.</strong>
              <span className="muted">
                Create the first merchant to generate a shareable request
                portal.
              </span>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

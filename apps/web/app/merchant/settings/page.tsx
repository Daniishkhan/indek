import { getMerchantPortalDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;
}

export default async function MerchantSettingsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const portal = await getMerchantPortalDataForUser(session.user.id);

  if (!portal) {
    return (
      <section className="panel">
        <div className="eyebrow">Settings</div>
        <h2>No merchant profile linked</h2>
        <p className="muted">
          Complete onboarding from the overview page first.
        </p>
      </section>
    );
  }

  const { merchant } = portal;

  return (
    <>
      <section className="panel stack">
        <div>
          <div className="eyebrow">Merchant profile</div>
          <h2 style={{ margin: 0 }}>{merchant.name}</h2>
        </div>
        <div className="list">
          <div className="list-item">
            <div className="split">
              <span className="label">Portal token</span>
              <code style={{ fontSize: "0.85rem" }}>{merchant.token}</code>
            </div>
          </div>
          <div className="list-item">
            <div className="split">
              <span className="label">Account email</span>
              <span className="value">{session.user.email}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <div className="eyebrow">Fees &amp; billing</div>
          <h2 style={{ margin: 0 }}>Platform defaults</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            These are set by the platform. Contact your operator to adjust them.
          </p>
        </div>
        <div className="list">
          <div className="list-item">
            <div className="split">
              <span className="label">Delivery fee</span>
              <span className="value">
                {formatCurrency(merchant.deliveryFeeAed)}
              </span>
            </div>
          </div>
          <div className="list-item">
            <div className="split">
              <span className="label">COD fee</span>
              <span className="value">
                {(merchant.codFeePercent * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="list-item">
            <div className="split">
              <span className="label">Remittance cycle</span>
              <span className="value">{merchant.remittanceCycle}</span>
            </div>
          </div>
          <div className="list-item">
            <div className="split">
              <span className="label">Proof requirement</span>
              <span className="value">{merchant.proofRequirement}</span>
            </div>
          </div>
          <div className="list-item">
            <div className="split">
              <span className="label">Dispute window</span>
              <span className="value">{merchant.disputeWindowDays} days</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

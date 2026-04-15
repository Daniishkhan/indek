import {
  getMerchantByToken,
  getParcelsForMerchant,
  getRemittanceForMerchant
} from "@indek/domain";
import { notFound } from "next/navigation";

function maskName(name: string) {
  const [first, last] = name.split(" ");
  return `${first} ${last?.[0] ?? ""}.`;
}

export default async function MerchantPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const merchant = getMerchantByToken(token);

  if (!merchant) {
    notFound();
  }

  const parcels = getParcelsForMerchant(merchant.id);
  const remittance = getRemittanceForMerchant(merchant.id);

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Merchant view</div>
        <h1>{merchant.name}</h1>
        <p>
          Read-only parcel status and remittance visibility designed for
          WhatsApp link sharing, with no login required.
        </p>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="eyebrow">Parcel status</div>
          <h2>Active and recent parcels</h2>
          <div className="list">
            {parcels.map((parcel) => (
              <div className="list-item" key={parcel.id}>
                <div className="split">
                  <strong>{parcel.awb}</strong>
                  <span className="chip">{parcel.state.replace("_", " ")}</span>
                </div>
                <div>{maskName(parcel.customerName)}</div>
                <div className="muted">
                  {parcel.area} · Updated {parcel.lastUpdateAt.slice(0, 16).replace("T", " ")}
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="eyebrow">Current cycle</div>
          <h2>Remittance snapshot</h2>
          {remittance ? (
            <div className="list">
              <div className="list-item">
                <div className="label">Cycle</div>
                <div className="value">{remittance.cycleLabel}</div>
              </div>
              <div className="list-item">
                <div className="label">Net payable</div>
                <div className="metric-value">AED {remittance.netPayableAed}</div>
              </div>
              <div className="list-item">
                <div className="label">VAT</div>
                <div className="value">AED {remittance.vatAed}</div>
              </div>
            </div>
          ) : (
            <p className="muted">No finalized statement for this merchant yet.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

import { Wallet } from "lucide-react";
import { getRiderDashboardDataForUser } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

export default async function RiderCashPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const dashboard = await getRiderDashboardDataForUser(session.user.id);
  if (!dashboard) {
    return (
      <section className="panel">
        <h2>Not set up yet</h2>
        <p>Ask your operator to link your rider profile.</p>
      </section>
    );
  }

  const { parcels, rider } = dashboard;
  const deliveredParcels = parcels.filter((p) => p.state === "delivered");

  // Group delivered parcels by merchant
  const byMerchant = new Map<
    string,
    { merchantName: string; total: number; count: number }
  >();
  for (const parcel of deliveredParcels) {
    const key = parcel.merchantId;
    const existing = byMerchant.get(key);
    if (existing) {
      existing.total += parcel.codAmountAed;
      existing.count += 1;
    } else {
      byMerchant.set(key, {
        merchantName: parcel.merchantName ?? "Unknown",
        total: parcel.codAmountAed,
        count: 1,
      });
    }
  }

  const merchantBreakdown = Array.from(byMerchant.values()).sort(
    (a, b) => b.total - a.total,
  );

  return (
    <>
      {/* Total cash held */}
      <section
        className="panel"
        style={{
          padding: 24,
          textAlign: "center",
        }}
      >
        <Wallet
          style={{
            width: 32,
            height: 32,
            color: "var(--primary)",
            marginBottom: 8,
          }}
        />
        <div className="muted" style={{ fontSize: "0.88rem", marginBottom: 4 }}>
          Total cash to hand over
        </div>
        <div style={{ fontSize: "2.2rem", fontWeight: 700 }}>
          {formatCurrency(rider.cashHeldAed)}
        </div>
        <div className="muted" style={{ fontSize: "0.82rem", marginTop: 8 }}>
          From {deliveredParcels.length} delivered parcel
          {deliveredParcels.length !== 1 ? "s" : ""}
        </div>
      </section>

      {/* Personal float */}
      <section
        className="panel"
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>Your personal float</span>
        <strong style={{ fontSize: "1rem" }}>
          {formatCurrency(rider.personalFloatAed)}
        </strong>
      </section>

      {/* Per-merchant breakdown */}
      {merchantBreakdown.length > 0 ? (
        <section className="panel stack" style={{ padding: 20 }}>
          <div className="eyebrow">Breakdown by merchant</div>
          <div className="list">
            {merchantBreakdown.map((entry) => (
              <article
                className="list-item"
                key={entry.merchantName}
                style={{ padding: "10px 0" }}
              >
                <div className="split">
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {entry.merchantName}
                    </strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {entry.count} parcel{entry.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                    {formatCurrency(entry.total)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel" style={{ padding: 20 }}>
          <div className="empty-state">
            <strong>No cash collected yet</strong>
            <span className="muted">
              Cash amounts will appear here as you deliver parcels.
            </span>
          </div>
        </section>
      )}
    </>
  );
}

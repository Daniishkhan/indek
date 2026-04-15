import Link from "next/link";
import { listRiders } from "@indek/domain";

export default function LiveOpsPage() {
  const riders = listRiders();

  return (
    <section className="panel">
      <div className="eyebrow">Journey 5</div>
      <h2>Live operations</h2>
      <div className="cards-grid">
        {riders.map((rider) => {
          const anomaly =
            rider.status !== "available" && rider.parcelsInCustody > 0 && rider.cashHeldAed > 1500;
          return (
            <article className="card" key={rider.id}>
              <div className="split">
                <strong>{rider.name}</strong>
                <span className={`chip ${anomaly ? "warn" : ""}`}>
                  {anomaly ? "check cash exposure" : rider.status.replace("_", " ")}
                </span>
              </div>
              <div className="two-col" style={{ marginTop: 16 }}>
                <div>
                  <div className="label">Parcels in custody</div>
                  <div className="value">{rider.parcelsInCustody}</div>
                </div>
                <div>
                  <div className="label">Delivered today</div>
                  <div className="value">{rider.deliveredToday}</div>
                </div>
                <div>
                  <div className="label">Cash held</div>
                  <div className="value">AED {rider.cashHeldAed}</div>
                </div>
                <div>
                  <div className="label">Last event</div>
                  <div className="value">{rider.lastEventAt.slice(11, 16)}</div>
                </div>
              </div>
              <Link
                className="button secondary"
                href={`/operator/reconciliation/${rider.id}`}
                style={{ marginTop: 18 }}
              >
                Open rider detail
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

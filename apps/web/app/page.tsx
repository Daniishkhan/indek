import Link from "next/link";
import { getOpsSnapshot, listMerchants } from "@indek/domain";

export default function HomePage() {
  const snapshot = getOpsSnapshot();
  const merchants = listMerchants();

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Indek v0 scaffold</div>
        <h1>Every parcel and every dirham, visible by default.</h1>
        <p>
          This starter app translates the local product docs into a working
          single-app Next.js foundation with operator, rider, and merchant
          surfaces backed by typed mock domain data.
        </p>
        <div className="cta-row">
          <Link className="button" href="/operator">
            Open operator console
          </Link>
          <Link className="button secondary" href="/rider">
            Open rider PWA
          </Link>
          <Link className="button secondary" href="/m/bloom-demo">
            Open merchant view
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <article className="metric">
          <div className="label">Active deliveries</div>
          <div className="metric-value">{snapshot.activeDeliveries}</div>
          <div className="muted">Parcels currently out with riders</div>
        </article>
        <article className="metric">
          <div className="label">COD exposure</div>
          <div className="metric-value">AED {snapshot.codExposureAed}</div>
          <div className="muted">Live rider-held cash across the fleet</div>
        </article>
        <article className="metric">
          <div className="label">Failed attempts</div>
          <div className="metric-value">{snapshot.failedAttempts}</div>
          <div className="muted">Queue that needs ops attention next</div>
        </article>
        <article className="metric">
          <div className="label">Merchants seeded</div>
          <div className="metric-value">{merchants.length}</div>
          <div className="muted">Ready for status and remittance views</div>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="eyebrow">What is included</div>
          <h2>Document-driven MVP shell</h2>
          <div className="cards-grid">
            <article className="card">
              <h3>Operator surface</h3>
              <p>
                Intake, dispatch board, live ops, and reconciliation flow wired
                to shared domain selectors.
              </p>
            </article>
            <article className="card">
              <h3>Rider surface</h3>
              <p>
                Manifest acceptance, parcel worklist, delivery actions, and cash
                visibility on a mobile-first route set.
              </p>
            </article>
            <article className="card">
              <h3>Merchant surface</h3>
              <p>
                Token-based status and remittance view with masked customer
                details and downloadable statement-ready structure.
              </p>
            </article>
          </div>
        </article>

        <aside className="panel">
          <div className="eyebrow">Demo tokens</div>
          <h2>Merchant links</h2>
          <div className="list">
            <Link className="list-item" href="/m/bloom-demo">
              <strong>Bloom Boutique</strong>
              <span className="muted">/m/bloom-demo</span>
            </Link>
            <Link className="list-item" href="/m/noon-demo">
              <strong>Noon Bakehouse</strong>
              <span className="muted">/m/noon-demo</span>
            </Link>
            <Link className="list-item" href="/m/safa-demo">
              <strong>Safa Pharmacy</strong>
              <span className="muted">/m/safa-demo</span>
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

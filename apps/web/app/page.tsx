import Image from "next/image";
import Link from "next/link";
import { getOpsSnapshot, listMerchants } from "@indek/domain";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import "./home.css";

export default async function HomePage() {
  const [snapshot, merchants, session] = await Promise.all([
    getOpsSnapshot(),
    listMerchants(),
    getCurrentSession(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const consoleHref = session ? getRoleHome(role) : "/sign-in";
  const consoleLabel = session ? "Enter console" : "Sign in";
  const previewMerchant = merchants[0];

  return (
    <div className="home">
      {/* Nav */}
      <div className="wrap">
        <nav className="nav">
          <Link href="/" className="brand">
            <span className="brand-mark">I</span>
            Indek <small>UAE</small>
          </Link>
          <div className="nav-right">
            <Link href="#problem" className="nav-link hide-m">
              Problem
            </Link>
            <Link href="#product" className="nav-link hide-m">
              Product
            </Link>
            <Link href="#surfaces" className="nav-link hide-m">
              Surfaces
            </Link>
            <Link href={consoleHref} className="nav-cta">
              {consoleLabel} <span className="arrow">→</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero — two column */}
      <section className="wrap hero-sec">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="home-eyebrow reveal reveal-1">
              <span className="dot" />
              COD operations platform · Built for UAE courier fleets
            </div>

            <h1 className="display reveal reveal-2">
              Every parcel. Every dirham.{" "}
              <span className="accent">Reconciled</span>{" "}
              <span className="stroke">at zero.</span>
            </h1>

            <p className="lede reveal reveal-3">
              Indek is the chain-of-custody operations platform for small UAE
              courier operators running multi-merchant cash-on-delivery with
              home-based riders.{" "}
              <b>
                Ninety-five percent of the work is cash, custody, and proof.
              </b>{" "}
              We built the whole product around that — and around the single
              line we won&apos;t cross: Indek never holds your money.
            </p>

            <div className="hero-cta reveal reveal-3">
              <Link href="/operator" className="btn btn-primary">
                Open the dispatch board <span className="arrow">→</span>
              </Link>
              {previewMerchant ? (
                <Link
                  href={`/m/${previewMerchant.token}`}
                  className="btn btn-ghost"
                >
                  Open merchant portal
                </Link>
              ) : (
                <Link href="#product" className="btn btn-ghost">
                  How it works
                </Link>
              )}
            </div>
          </div>

          <div className="hero-art reveal reveal-2" aria-hidden="true">
            <div className="hero-art-frame">
              <Image
                src="/rider-illustration.jpg"
                alt=""
                width={1536}
                height={856}
                priority
                className="hero-art-img"
              />
            </div>
          </div>
        </div>

        {/* Live ticker strip */}
        <div className="ticker reveal reveal-4">
          <div className="ticker-cell">
            <span className="ticker-label">Parcels in flight</span>
            <span className="ticker-value">
              {String(snapshot.activeDeliveries).padStart(2, "0")}
            </span>
            <span className="ticker-foot">Out with riders, tracked live</span>
          </div>
          <div className="ticker-cell">
            <span className="ticker-label">Rider-held cash</span>
            <span className="ticker-value accent">
              AED {snapshot.codExposureAed}
            </span>
            <span className="ticker-foot">Across the fleet, per-merchant</span>
          </div>
          <div className="ticker-cell">
            <span className="ticker-label">Awaiting reattempt</span>
            <span className="ticker-value">
              {String(snapshot.failedAttempts).padStart(2, "0")}
            </span>
            <span className="ticker-foot">Queued with reason codes</span>
          </div>
          <div className="ticker-cell">
            <span className="ticker-label">Open manifests</span>
            <span className="ticker-value ok">
              {String(snapshot.activeManifests).padStart(2, "0")}
            </span>
            <span className="ticker-foot">
              Active rider assignments in progress
            </span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="wrap section">
        <div className="section-head">
          <div className="section-num">01 · Problem</div>
          <div>
            <h2 className="section-title">
              Three WhatsApp groups and a shared sheet is how most fleets run.{" "}
              <span className="accent">It breaks at ten riders.</span>
            </h2>
            <p className="section-sub">
              The operator becomes a data-entry clerk to their own business.
              Cash leaks across merchants. Riders argue about deliveries nobody
              scanned. Merchants lose faith in remittance. The tenth rider is
              the one who breaks the workflow.
            </p>
          </div>
        </div>

        <div className="editorial">
          <div />
          <p className="pull">
            A rider running one shift carries{" "}
            <span className="accent">AED 1,500 – 5,000</span> in pocket cash —
            collected on behalf of a dozen merchants, co-mingled with their
            personal float for change.
          </p>
          <p className="pull-copy">
            There is no live view of who is holding how much for whom. No
            automatic reconciliation between delivered parcels and handed-in
            cash. No per-merchant sub-ledger when the rider returns at end of
            day. Small losses compound into unprofitable months. Merchant trust
            erodes quietly, then all at once.
          </p>
        </div>

        <div className="stats-row">
          <div className="stat">
            <span className="stat-num">
              20<span className="unit">%</span>
            </span>
            <span className="stat-label">COD return rate</span>
            <span className="stat-caption">
              Versus 3% on prepaid. Every fifth parcel becomes reverse logistics
              the operator absorbs.
            </span>
          </div>
          <div className="stat">
            <span className="stat-num">
              2 – 5<span className="unit">%</span>
            </span>
            <span className="stat-label">Cash leakage per month</span>
            <span className="stat-caption">
              Industry estimate of collected COD that never traces back to a
              cause. Untraced, it&apos;s unrecoverable.
            </span>
          </div>
          <div className="stat">
            <span className="stat-num">
              31.6<span className="unit">%</span>
            </span>
            <span className="stat-label">UAE e-commerce on COD</span>
            <span className="stat-caption">
              Roughly a third of orders. Not going away — and no platform
              serving small operators treats it as first-class.
            </span>
          </div>
        </div>
      </section>

      {/* Product / Capabilities */}
      <section id="product" className="wrap section">
        <div className="section-head">
          <div className="section-num">02 · Product</div>
          <div>
            <h2 className="section-title">
              Three tightly coupled capabilities — and{" "}
              <span className="accent">one line</span> we won&apos;t cross.
            </h2>
            <p className="section-sub">
              Indek replaces the WhatsApp-and-Excel operation with chain of
              custody, closed-loop cash, and a single control plane. Then a
              fourth thing — a non-capability — that shapes every decision
              inside the product.
            </p>
          </div>
        </div>

        <div className="cap-list">
          <article className="cap">
            <div className="cap-num">01</div>
            <h3 className="cap-title">
              Chain of custody, <span className="accent">event-sourced</span> by
              default.
            </h3>
            <div className="cap-body">
              <b>Every state transition is an immutable event</b> — pickup,
              in-transit, attempted, delivered, failed, in-return — with rider
              identity, timestamp, geolocation, photo, and (for COD) a customer
              OTP. Rider-to-rider handoffs and partial deliveries are
              first-class events. Disputes become queries against an append-only
              log.
              <div className="cap-tags">
                <span className="cap-tag">Parcel lifecycle</span>
                <span className="cap-tag">Custody transfer</span>
                <span className="cap-tag">Partial delivery</span>
                <span className="cap-tag">Proof of delivery</span>
              </div>
            </div>
          </article>

          <article className="cap">
            <div className="cap-num">02</div>
            <h3 className="cap-title">
              Closed-loop cash with <span className="accent">per-merchant</span>{" "}
              sub-ledgers.
            </h3>
            <div className="cap-body">
              Every rider has a live ledger tracking{" "}
              <b>COD collected per parcel, per merchant</b>, personal
              change-float, inter-rider transfers, and drops to the operator.
              Every COD line carries an expected amount, an actual amount, and a
              variance reason — because partial acceptance and at-door
              renegotiation are routine, not exceptions. End-of-shift cannot
              close until parcels match zero and variance matches zero.
              <div className="cap-tags">
                <span className="cap-tag">Rider cash ledger</span>
                <span className="cap-tag">Expected vs actual</span>
                <span className="cap-tag">VAT-separated remittance</span>
              </div>
            </div>
          </article>

          <article className="cap">
            <div className="cap-num">03</div>
            <h3 className="cap-title">
              One <span className="accent">control plane</span> — WhatsApp
              stays, but only as the pipe.
            </h3>
            <div className="cap-body">
              One operator console for intake, dispatch, reconciliation, RTO,
              and reporting. One rider PWA for scanning, delivering, and closing
              the day. One tokenized merchant view for status and remittance.{" "}
              <b>
                WhatsApp becomes the notification channel, not the system of
                record.
              </b>{" "}
              The critical path — assignment, status, cash, proof — lives in
              Indek.
              <div className="cap-tags">
                <span className="cap-tag">Operator console</span>
                <span className="cap-tag">Rider PWA</span>
                <span className="cap-tag">Merchant status link</span>
              </div>
            </div>
          </article>

          <article className="cap constitutive">
            <div className="cap-num">— NC</div>
            <h3 className="cap-title">
              Indek <span className="accent">never holds</span> your money. This
              is constitutive, not a feature.
            </h3>
            <div className="cap-body">
              Cash moves physically: rider → operator → operator&apos;s bank →
              merchant. Indek records every step but{" "}
              <b>never sits in the funds flow</b>. That posture keeps the
              platform outside CBUAE retail-payment-services and
              stored-value-facility licensing scope — and it must be defended in
              every product decision we make from here on.
              <div className="cap-tags">
                <span className="cap-tag">Logistics &amp; reconciliation</span>
                <span className="cap-tag">Not a wallet</span>
                <span className="cap-tag">Not a processor</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Ledger preview */}
      <section className="wrap section">
        <div className="section-head">
          <div className="section-num">03 · How it looks</div>
          <div>
            <h2 className="section-title">
              The <span className="accent">end-of-shift</span> row, on the day a
              partial happens.
            </h2>
            <p className="section-sub">
              A real reconciliation scenario: 20 deliveries, one at-door
              renegotiation on a perfume order, one failed attempt queued for
              reattempt, one partial acceptance. Variance traces to a reason
              code. Shift closes only when the row balances.
            </p>
          </div>
        </div>

        <div className="ledger">
          <div className="ledger-head">
            <span>•</span>
            <span>Parcel · Merchant</span>
            <span>Expected</span>
            <span>Collected</span>
            <span className="hide-m">Variance</span>
            <span className="hide-m">Reason</span>
          </div>
          <div className="ledger-row">
            <span className="pod delivered" />
            <span className="lm">IDK-4471 · Bloom Boutique</span>
            <span className="lm">AED 285.00</span>
            <span className="lok">AED 285.00</span>
            <span className="lmute hide-m">—</span>
            <span className="lmute hide-m">delivered</span>
          </div>
          <div className="ledger-row">
            <span className="pod delivered" />
            <span className="lm">IDK-4472 · Noon Bakehouse</span>
            <span className="lm">AED 78.00</span>
            <span className="lok">AED 78.00</span>
            <span className="lmute hide-m">—</span>
            <span className="lmute hide-m">delivered · OTP</span>
          </div>
          <div className="ledger-row">
            <span className="pod partial" />
            <span className="lm">IDK-4473 · Bloom Boutique</span>
            <span className="lm">AED 420.00</span>
            <span className="lembr">AED 340.00</span>
            <span className="lembr hide-m">−80.00</span>
            <span className="lmute hide-m">customer kept 2 of 3</span>
          </div>
          <div className="ledger-row">
            <span className="pod failed" />
            <span className="lm">IDK-4474 · Safa Pharmacy</span>
            <span className="lm">AED 145.00</span>
            <span className="lmute">—</span>
            <span className="lmute hide-m">—</span>
            <span className="lmute hide-m">not-home · reattempt</span>
          </div>
          <div className="ledger-row">
            <span className="pod delivered" />
            <span className="lm">IDK-4475 · Noon Bakehouse</span>
            <span className="lm">AED 52.00</span>
            <span className="lok">AED 52.00</span>
            <span className="lmute hide-m">—</span>
            <span className="lmute hide-m">delivered</span>
          </div>
          <div className="ledger-row footer">
            <span>Σ</span>
            <span className="lm">5 of 20 shown · 3 merchants</span>
            <span className="lm">AED 980.00</span>
            <span className="lm">AED 755.00</span>
            <span className="lembr hide-m">−80.00 · 1 pending</span>
            <span className="lok hide-m">reconciles to zero</span>
          </div>
        </div>
      </section>

      {/* Surfaces */}
      <section id="surfaces" className="wrap section">
        <div className="section-head">
          <div className="section-num">04 · Surfaces</div>
          <div>
            <h2 className="section-title">
              Three surfaces.{" "}
              <span className="accent">One source of truth.</span>
            </h2>
            <p className="section-sub">
              {merchants.length} merchants seeded in the demo. Tap in to any of
              the three surfaces to see the same event log from a different
              angle.
            </p>
          </div>
        </div>

        <div className="surfaces">
          <Link href="/operator" className="surface">
            <span className="surface-tag">/operator</span>
            <h3 className="surface-name">Operator console</h3>
            <p className="surface-desc">
              Intake, dispatch board, live ops, and the reconciliation flow that
              closes a shift only when custody and cash both hit zero.
            </p>
            <div className="surface-foot">
              <span>Enter</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          <Link href="/rider" className="surface">
            <span className="surface-tag">/rider</span>
            <h3 className="surface-name">Rider PWA</h3>
            <p className="surface-desc">
              Accept the manifest, scan at pickup, deliver with photo and OTP,
              record variance at the door, watch the cash ledger update live.
            </p>
            <div className="surface-foot">
              <span>Open</span>
              <span className="arrow">→</span>
            </div>
          </Link>

          <Link href="/m/bloom-demo" className="surface">
            <span className="surface-tag">/m/:token</span>
            <h3 className="surface-name">Merchant view</h3>
            <p className="surface-desc">
              Tokenized status and remittance, with masked customer details and
              a statement-ready structure. No login. One link per merchant.
            </p>
            <div className="surface-foot">
              <span>View demo</span>
              <span className="arrow">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Closing CTA band */}
      <div className="wrap">
        <section className="closing">
          <div className="closing-wrap">
            <div className="closing-eyebrow">The promise</div>
            <h2 className="closing-line">
              End the shift at <span className="accent">zero variance</span>. Go
              home on time.
            </h2>
            <p className="closing-copy">
              Indek is built for the operator whose current workflow cannot
              survive a doubling of fleet size — and who knows it. The tenth
              rider is coming. When they arrive, custody and cash will already
              be handled.
            </p>
            <div className="hero-cta" style={{ justifyContent: "flex-start" }}>
              <Link href="/operator" className="btn btn-primary">
                Open the dispatch board <span className="arrow">→</span>
              </Link>
              <Link href="/rider" className="btn btn-ghost">
                See the rider PWA
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="wrap">
        <footer className="foot">
          <Link href="/" className="brand">
            <span className="brand-mark">I</span>
            Indek <small>UAE</small>
          </Link>
          <span>Logistics &amp; reconciliation · Not a payment processor</span>
        </footer>
      </div>
    </div>
  );
}

import Link from "next/link";
import "./auth.css";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Link href="/" className="auth-mark auth-reveal auth-reveal-1">
          Indek <small>v0 · Dubai</small>
        </Link>

        <div>
          <h1 className="auth-display auth-reveal auth-reveal-2">
            Every parcel.
            <br />
            Every dirham.
            <br />
            <em>Reconciled</em> <span className="stroke">at zero.</span>
          </h1>
          <p className="auth-sub auth-reveal auth-reveal-3">
            The chain-of-custody operations platform for UAE courier operators
            running multi-merchant cash-on-delivery with home-based riders.
          </p>
        </div>

        <div className="auth-proof auth-reveal auth-reveal-4">
          <div className="auth-proof-row">
            <span className="dot" />
            <span>COD is ~32% of UAE e-commerce orders</span>
            <span className="v">31.6%</span>
          </div>
          <div className="auth-proof-row">
            <span className="dot" />
            <span>COD parcels come back at</span>
            <span className="v">20%</span>
          </div>
          <div className="auth-proof-row">
            <span className="dot ok" />
            <span>Indek never holds operator funds</span>
            <span className="v">0 AED</span>
          </div>
        </div>
      </aside>

      <section className="auth-form-wrap">
        <Link href="/" className="auth-back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="14"
            height="14"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to site
        </Link>
        {children}
      </section>
    </div>
  );
}

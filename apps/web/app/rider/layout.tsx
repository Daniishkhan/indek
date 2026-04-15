import Link from "next/link";

export default function RiderLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="shell" style={{ width: "min(560px, calc(100vw - 20px))" }}>
      <header className="panel topbar">
        <div>
          <div className="eyebrow">Rider PWA</div>
          <h1 style={{ margin: 0 }}>Shift companion</h1>
        </div>
        <div className="nav-links">
          <Link href="/rider">Manifest</Link>
        </div>
      </header>
      {children}
    </main>
  );
}

import Link from "next/link";
import { AlertCircle, Package, Truck, Wallet } from "lucide-react";
import { getDispatchBoardData } from "@indek/domain";
import { DispatchBoard } from "@/components/dispatch-board";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "manifest-created": {
      tone: "success",
      text: "Manifest assigned. Selected parcels are now attached to the rider.",
    },
    "manifest-missing-selection": {
      tone: "warn",
      text: "Choose a rider and at least one parcel before assigning a manifest.",
    },
    "manifest-failed": {
      tone: "warn",
      text: "That manifest could not be created. Refresh and try again.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function formatCurrencyCompact(value: number) {
  if (value >= 1000) return `AED ${(value / 1000).toFixed(1)}k`;
  return `AED ${Math.round(value)}`;
}

export default async function DispatchBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ manifests, parcels, riders }, params] = await Promise.all([
    getDispatchBoardData(),
    searchParams,
  ]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  const queueCod = parcels.reduce((sum, p) => sum + p.codAmountAed, 0);
  const availableRiders = riders.filter((r) => r.status !== "off_shift").length;
  const openManifests = manifests.length;
  const acceptedManifests = manifests.filter((m) => m.accepted).length;

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Unassigned queue</span>
            <span className="kpi-icon amber">
              <AlertCircle />
            </span>
          </div>
          <div className="kpi-value">{parcels.length}</div>
          <div className="kpi-foot">
            <span>Waiting to be dispatched</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">COD in queue</span>
            <span className="kpi-icon success">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">{formatCurrencyCompact(queueCod)}</div>
          <div className="kpi-foot">
            <span>Pending collection</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Riders on shift</span>
            <span className="kpi-icon">
              <Package />
            </span>
          </div>
          <div className="kpi-value">{availableRiders}</div>
          <div className="kpi-foot">
            <span>{riders.length - availableRiders} off shift</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Open manifests</span>
            <span className="kpi-icon cyan">
              <Truck />
            </span>
          </div>
          <div className="kpi-value">{openManifests}</div>
          <div className="kpi-foot">
            <span>{acceptedManifests} accepted</span>
          </div>
        </article>
      </section>

      {riders.length === 0 && parcels.length === 0 ? (
        <div className="empty-state">
          <strong>Dispatch needs riders and parcels to start.</strong>
          <span className="muted">
            Add riders from <Link href="/operator/riders">riders</Link>, then
            create or wait for merchant requests to land in the queue.
          </span>
        </div>
      ) : (
        <DispatchBoard
          manifests={manifests}
          parcels={parcels}
          riders={riders}
        />
      )}

      {manifests.length > 0 ? (
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Open manifests</div>
              <h2 style={{ margin: 0 }}>Current board output</h2>
            </div>
            <span className="chip">{manifests.length}</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Rider</th>
                <th>Zones</th>
                <th>Parcels</th>
                <th>Pickups</th>
                <th style={{ textAlign: "right" }}>Expected COD</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {manifests.map((manifest) => (
                <tr key={manifest.id}>
                  <td>
                    <strong>{manifest.riderName ?? manifest.riderId}</strong>
                  </td>
                  <td className="muted">{manifest.zoneSummary}</td>
                  <td>{manifest.parcelIds.length}</td>
                  <td>{manifest.pickupCount}</td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(manifest.expectedCodAed)}
                  </td>
                  <td>
                    <span
                      className={`status-dot ${
                        manifest.accepted ? "success" : "warn"
                      }`}
                    >
                      {manifest.accepted ? "accepted" : "awaiting accept"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}

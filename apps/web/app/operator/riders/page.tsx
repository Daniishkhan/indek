import Link from "next/link";
import { Package, UserCircle2, UserPlus, Wallet } from "lucide-react";
import { listRiders } from "@indek/domain";
import { createRiderAction } from "@/app/actions";

const NOTICE_COPY: Record<string, { tone: "success" | "warn"; text: string }> =
  {
    "rider-created": {
      tone: "success",
      text: "Rider added to the roster.",
    },
    "rider-missing-fields": {
      tone: "warn",
      text: "Rider name and zone are both required.",
    },
  };

function formatCurrency(value: number) {
  return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

function statusTone(status: string): "success" | "warn" | "danger" {
  if (status === "available") return "success";
  if (status === "off_shift") return "danger";
  return "warn";
}

export default async function OperatorRidersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [riders, params] = await Promise.all([listRiders(), searchParams]);
  const notice = params.notice ? NOTICE_COPY[params.notice] : undefined;

  const onShift = riders.filter((r) => r.status !== "off_shift").length;
  const offShift = riders.length - onShift;
  const totalCustody = riders.reduce((sum, r) => sum + r.parcelsInCustody, 0);
  const totalCash = riders.reduce((sum, r) => sum + r.cashHeldAed, 0);

  return (
    <>
      {notice ? (
        <div className={`notice ${notice.tone}`}>{notice.text}</div>
      ) : null}

      <section className="stats-grid">
        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">On shift</span>
            <span className="kpi-icon success">
              <UserCircle2 />
            </span>
          </div>
          <div className="kpi-value">{onShift}</div>
          <div className="kpi-foot">
            <span>{offShift} off shift</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Parcels in custody</span>
            <span className="kpi-icon">
              <Package />
            </span>
          </div>
          <div className="kpi-value">{totalCustody}</div>
          <div className="kpi-foot">
            <span>Across the fleet</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Cash held</span>
            <span className="kpi-icon cyan">
              <Wallet />
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(totalCash)}</div>
          <div className="kpi-foot">
            <span>Awaiting reconciliation</span>
          </div>
        </article>

        <article className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Total roster</span>
            <span className="kpi-icon amber">
              <UserPlus />
            </span>
          </div>
          <div className="kpi-value">{riders.length}</div>
          <div className="kpi-foot">
            <span>Riders on the books</span>
          </div>
        </article>
      </section>

      <section className="two-col">
        <article className="panel stack">
          <div>
            <div className="eyebrow">New rider</div>
            <h2 style={{ margin: 0 }}>Add a rider to the roster</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Register a rider with their zone and starting float. They become
              eligible for manifests as soon as status is set to available.
            </p>
          </div>

          <form action={createRiderAction} className="stack">
            <div className="form-grid">
              <label className="form-field">
                <span className="label">Rider name</span>
                <input
                  className="input"
                  name="name"
                  placeholder="Hassan Ali"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Primary zone</span>
                <input
                  className="input"
                  name="zone"
                  placeholder="Dubai Marina"
                  required
                />
              </label>
              <label className="form-field">
                <span className="label">Status</span>
                <select
                  className="select"
                  defaultValue="available"
                  name="status"
                >
                  <option value="available">Available</option>
                  <option value="on_shift">On shift</option>
                  <option value="returning">Returning</option>
                  <option value="off_shift">Off shift</option>
                </select>
              </label>
              <label className="form-field">
                <span className="label">Personal float (AED)</span>
                <input
                  className="input"
                  defaultValue="100"
                  min="0"
                  name="personalFloatAed"
                  step="0.01"
                  type="number"
                />
              </label>
            </div>
            <button className="button" type="submit">
              Add rider
            </button>
          </form>
        </article>

        <aside className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Roster</div>
              <h2 style={{ margin: 0 }}>Current riders</h2>
            </div>
            <span className="chip">{riders.length}</span>
          </div>

          {riders.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Custody</th>
                  <th style={{ textAlign: "right" }}>Cash held</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.id}>
                    <td>
                      <strong>{rider.name}</strong>
                    </td>
                    <td className="muted">{rider.zone}</td>
                    <td>
                      <span
                        className={`status-dot ${statusTone(rider.status)}`}
                      >
                        {rider.status.replace("_", " ")}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {rider.parcelsInCustody}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCurrency(rider.cashHeldAed)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        className="button ghost"
                        href={`/operator/reconciliation/${rider.id}`}
                      >
                        Reconcile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <strong>No riders on the roster yet.</strong>
              <span className="muted">
                Add at least one rider so dispatch can create manifests.
              </span>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

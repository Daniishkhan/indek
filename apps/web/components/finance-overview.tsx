"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";

type FinanceParcel = {
  id: string;
  awb: string;
  customerName: string;
  customerPhone: string;
  area: string;
  codAmountAed: number;
  state: string;
  financialState: "collected" | "pending" | "failed";
  deliveryFeeAed: number;
  handlingFeeAed: number;
  netAed: number;
  lastUpdateAt: string;
};

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

const STATE_FILTERS = [
  { value: "all", label: "All" },
  { value: "collected", label: "Collected" },
  { value: "pending", label: "In transit" },
  { value: "failed", label: "Failed" },
] as const;

const STATE_CHIP: Record<
  FinanceParcel["financialState"],
  { tone: string; label: string }
> = {
  collected: { tone: "success", label: "Collected" },
  pending: { tone: "warn", label: "Pending" },
  failed: { tone: "danger", label: "Failed" },
};

export function FinanceOverview({
  merchantName,
  parcels,
}: {
  merchantName: string;
  parcels: FinanceParcel[];
}) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const q = query.toLowerCase().trim();
  const filtered = parcels.filter((p) => {
    if (stateFilter !== "all" && p.financialState !== stateFilter) return false;
    if (!q) return true;
    return (
      p.awb.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q)
    );
  });

  const totals = filtered.reduce(
    (acc, p) => ({
      cod: acc.cod + p.codAmountAed,
      fees: acc.fees + p.deliveryFeeAed + p.handlingFeeAed,
      net: acc.net + p.netAed,
    }),
    { cod: 0, fees: 0, net: 0 },
  );

  function downloadCsv() {
    const headers = [
      "AWB",
      "Customer",
      "Phone",
      "Area",
      "Status",
      "COD (AED)",
      "Delivery Fee",
      "Handling Fee",
      "Net (AED)",
      "Last Updated",
    ];
    const rows = filtered.map((p) => [
      p.awb,
      p.customerName,
      p.customerPhone,
      p.area,
      STATE_CHIP[p.financialState].label,
      p.codAmountAed.toFixed(2),
      p.financialState === "collected" ? p.deliveryFeeAed.toFixed(2) : "",
      p.financialState === "collected" ? p.handlingFeeAed.toFixed(2) : "",
      p.financialState === "collected" ? p.netAed.toFixed(2) : "",
      new Date(p.lastUpdateAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${merchantName.replace(/\s+/g, "-").toLowerCase()}-statement-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel stack">
      <div className="split">
        <div>
          <div className="eyebrow">Statement</div>
          <h2 style={{ margin: 0 }}>Order-level breakdown</h2>
        </div>
        <button
          className="button secondary"
          onClick={downloadCsv}
          type="button"
        >
          <Download style={{ width: 14, height: 14, marginRight: 6 }} />
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="input"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by AWB or customer..."
            style={{ paddingLeft: 36 }}
            type="text"
            value={query}
          />
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATE_FILTERS.map((f) => (
            <button
              className={`chip ${stateFilter === f.value ? "primary" : ""}`}
              key={f.value}
              onClick={() => setStateFilter(f.value)}
              style={{ cursor: "pointer", border: "none" }}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="muted" style={{ fontSize: "0.85rem" }}>
        {filtered.length} of {parcels.length} orders
      </div>

      {filtered.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>AWB</th>
                <th>Customer</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>COD</th>
                <th style={{ textAlign: "right" }}>Delivery fee</th>
                <th style={{ textAlign: "right" }}>Handling fee</th>
                <th style={{ textAlign: "right" }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const chip = STATE_CHIP[p.financialState];
                return (
                  <tr key={p.id}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {p.awb}
                    </td>
                    <td>{p.customerName}</td>
                    <td>
                      <span className={`chip ${chip.tone}`}>{chip.label}</span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCurrency(p.codAmountAed)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {p.financialState === "collected"
                        ? formatCurrency(p.deliveryFeeAed)
                        : "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {p.financialState === "collected"
                        ? formatCurrency(p.handlingFeeAed)
                        : "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                      }}
                    >
                      {p.financialState === "collected"
                        ? formatCurrency(p.netAed)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr
                style={{
                  fontWeight: 700,
                  borderTop: "2px solid var(--border)",
                }}
              >
                <td colSpan={3}>Totals</td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(totals.cod)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {totals.fees > 0 ? formatCurrency(totals.fees) : "—"}
                </td>
                <td />
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {totals.net > 0 ? formatCurrency(totals.net) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>No orders match your search.</strong>
          <span className="muted">Try a different search term or filter.</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Upload } from "lucide-react";
import type { Merchant } from "@indek/shared";

type ParsedRow = {
  customerName: string;
  customerPhone: string;
  deliveryArea: string;
  deliveryAddress: string;
  codAmount: number;
  itemSummary: string;
  pickupAddress: string;
  notes: string;
};

type ValidatedRow = ParsedRow & {
  errors: string[];
  rowNum: number;
};

const EXPECTED_HEADERS = [
  "customer_name",
  "customer_phone",
  "delivery_area",
  "delivery_address",
  "cod_amount",
  "item_summary",
  "pickup_address",
  "notes",
] as const;

const TEMPLATE_CSV = [
  EXPECTED_HEADERS.join(","),
  '"Maha Saeed","+971 50 111 2233","JVC","Belgravia Heights Tower B apt 307","250","Dessert box","Al Quoz warehouse gate 2","Call before arrival"',
  '"Ahmad Noor","+971 55 222 3344","Marina","Marina Walk Building 3 unit 12","180","Gift set","",""',
].join("\n");

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let fields: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && next === "\n") i++;
        fields.push(current.trim());
        if (fields.some((f) => f.length > 0)) rows.push(fields);
        fields = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  if (fields.some((f) => f.length > 0)) rows.push(fields);

  return rows;
}

function validateRow(row: ParsedRow, rowNum: number): ValidatedRow {
  const errors: string[] = [];
  if (!row.customerName) errors.push("Customer name is required");
  if (!row.customerPhone) errors.push("Customer phone is required");
  if (!row.deliveryArea) errors.push("Delivery area is required");
  if (!row.deliveryAddress) errors.push("Delivery address is required");
  if (!row.itemSummary) errors.push("Item summary is required");
  if (Number.isNaN(row.codAmount) || row.codAmount < 0)
    errors.push("COD amount must be a number >= 0");
  return { ...row, errors, rowNum };
}

function mapRow(fields: string[]): ParsedRow {
  return {
    customerName: fields[0] ?? "",
    customerPhone: fields[1] ?? "",
    deliveryArea: fields[2] ?? "",
    deliveryAddress: fields[3] ?? "",
    codAmount: Number.parseFloat(fields[4] ?? "0") || 0,
    itemSummary: fields[5] ?? "",
    pickupAddress: fields[6] ?? "",
    notes: fields[7] ?? "",
  };
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "indek-bulk-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadForm({
  action,
  merchant,
}: {
  action: (formData: FormData) => void | Promise<void>;
  merchant: Merchant;
}) {
  const [rows, setRows] = useState<ValidatedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows?.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = rows?.filter((r) => r.errors.length > 0) ?? [];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;

      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setParseError("The CSV needs a header row and at least one data row.");
        setRows(null);
        return;
      }

      const headers = parsed[0]!.map((h) =>
        h.toLowerCase().replace(/\s+/g, "_"),
      );
      const requiredHeaders = EXPECTED_HEADERS.slice(0, 6);
      const missing = requiredHeaders.filter((h) => !headers.includes(h));
      if (missing.length > 0) {
        setParseError(
          `Missing required columns: ${missing.join(", ")}. Download the template for the expected format.`,
        );
        setRows(null);
        return;
      }

      const headerIndex = new Map(headers.map((h, i) => [h, i]));
      const dataRows = parsed.slice(1);

      const validated = dataRows.map((fields, i) => {
        const reordered = EXPECTED_HEADERS.map(
          (h) => fields[headerIndex.get(h) ?? -1] ?? "",
        );
        return validateRow(mapRow(reordered), i + 2);
      });

      setRows(validated);
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setRows(null);
    setParseError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Upload state
  if (!rows) {
    return (
      <div className="stack">
        {parseError ? <div className="notice warn">{parseError}</div> : null}

        <div
          className="panel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            border: "2px dashed var(--border)",
            cursor: "pointer",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload
            style={{
              width: 40,
              height: 40,
              color: "var(--muted)",
              marginBottom: 16,
            }}
          />
          <h3 style={{ margin: "0 0 6px" }}>
            Drop your CSV here or click to browse
          </h3>
          <p className="muted" style={{ margin: 0, maxWidth: 400 }}>
            Upload a CSV file with your delivery orders. Required columns:
            customer name, phone, area, address, COD amount, and item summary.
          </p>
          <input
            ref={fileRef}
            accept=".csv,text/csv"
            onChange={handleFile}
            style={{ display: "none" }}
            type="file"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            className="button ghost"
            onClick={downloadTemplate}
            type="button"
          >
            <Download style={{ width: 14, height: 14, marginRight: 6 }} />
            Download CSV template
          </button>
        </div>
      </div>
    );
  }

  // Preview state
  return (
    <div className="stack">
      <div className="split">
        <div>
          <span className="chip success" style={{ marginRight: 8 }}>
            {validRows.length} valid
          </span>
          {invalidRows.length > 0 ? (
            <span className="chip danger">
              {invalidRows.length} with errors
            </span>
          ) : null}
        </div>
        <button className="button ghost" onClick={handleReset} type="button">
          Upload different file
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Address</th>
              <th style={{ textAlign: "right" }}>COD</th>
              <th>Items</th>
              <th>Pickup</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasErrors = row.errors.length > 0;
              return (
                <tr
                  key={row.rowNum}
                  style={
                    hasErrors
                      ? { background: "var(--danger-bg, #fef2f2)" }
                      : undefined
                  }
                >
                  <td className="muted">{row.rowNum}</td>
                  <td>
                    {row.customerName || <span className="muted">-</span>}
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {row.customerPhone || <span className="muted">-</span>}
                  </td>
                  <td>
                    {row.deliveryArea || <span className="muted">-</span>}
                  </td>
                  <td
                    style={{
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.deliveryAddress || <span className="muted">-</span>}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Number.isNaN(row.codAmount)
                      ? "-"
                      : `AED ${row.codAmount.toFixed(0)}`}
                  </td>
                  <td>{row.itemSummary || <span className="muted">-</span>}</td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.pickupAddress || (
                      <span className="muted">default</span>
                    )}
                  </td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.notes || <span className="muted">-</span>}
                  </td>
                  <td>
                    {hasErrors ? (
                      <span
                        className="chip danger"
                        title={row.errors.join("; ")}
                        style={{ cursor: "help" }}
                      >
                        <AlertCircle
                          style={{ width: 12, height: 12, marginRight: 4 }}
                        />
                        Error
                      </span>
                    ) : (
                      <span className="chip success">
                        <CheckCircle2
                          style={{ width: 12, height: 12, marginRight: 4 }}
                        />
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {invalidRows.length > 0 ? (
        <div className="notice warn">
          {invalidRows.length} row{invalidRows.length > 1 ? "s have" : " has"}{" "}
          errors and will be skipped. Hover the error badge to see details.
        </div>
      ) : null}

      <form action={action} onSubmit={() => setSubmitting(true)}>
        <input name="token" type="hidden" value={merchant.token} />
        <textarea
          name="rows"
          style={{ display: "none" }}
          readOnly
          value={JSON.stringify(
            validRows.map((r) => ({
              customerName: r.customerName,
              customerPhone: r.customerPhone,
              deliveryArea: r.deliveryArea,
              deliveryAddress: r.deliveryAddress,
              codAmount: r.codAmount,
              itemSummary: r.itemSummary,
              pickupAddress: r.pickupAddress,
              notes: r.notes,
            })),
          )}
        />
        <button
          className="button"
          disabled={validRows.length === 0 || submitting}
          type="submit"
        >
          {submitting
            ? `Creating ${validRows.length} orders…`
            : `Submit ${validRows.length} order${validRows.length === 1 ? "" : "s"}`}
        </button>
      </form>
    </div>
  );
}

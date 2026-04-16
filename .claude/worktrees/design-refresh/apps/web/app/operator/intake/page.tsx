import { listMerchants, listUnassignedParcels } from "@indek/domain";

const samplePaste = `customer_name\tphone\taddress\tcod_amount\titem_summary
Rania T.\t+971523009011\tExecutive Towers, podium\t280\tAbaya set
Lina D.\t+971581230088\tBelgravia Heights, tower B\t120\tDessert box`;

export default function IntakePage() {
  const merchants = listMerchants();
  const queue = listUnassignedParcels();

  return (
    <section className="grid">
      <article className="panel">
        <div className="eyebrow">Journey 1</div>
        <h2>Fast merchant batch intake</h2>
        <p>
          This scaffold uses a copy-friendly intake surface that mirrors the UX
          doc: pick a merchant, paste rows from Excel or Sheets, then generate
          labels into the unassigned queue.
        </p>
        <div className="card">
          <div className="split">
            <div>
              <div className="label">Default merchant</div>
              <div className="value">{merchants[0]?.name}</div>
            </div>
            <div className="chip">{merchants[0]?.proofRequirement}</div>
          </div>
          <pre
            style={{
              margin: "18px 0 0",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            {samplePaste}
          </pre>
        </div>
      </article>

      <aside className="panel">
        <div className="eyebrow">Queue preview</div>
        <h2>Waiting to assign</h2>
        <div className="list">
          {queue.map((parcel) => (
            <div className="list-item" key={parcel.id}>
              <strong>{parcel.awb}</strong>
              <div className="muted">{parcel.customerName}</div>
              <div className="split">
                <span>{parcel.area}</span>
                <span className="chip warn">AED {parcel.codAmountAed}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

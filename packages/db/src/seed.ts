import { config } from "dotenv";
import { getDb, getPool } from "./client";
import { merchants, riders } from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const db = getDb();

  // --- Merchants (match the token links the home page demos) ---
  const demoMerchants = [
    { id: "m-bloom", name: "Bloom Boutique", token: "bloom-demo" },
    { id: "m-noonbake", name: "Noon Bakehouse", token: "noon-demo" },
    { id: "m-safa", name: "Safa Pharmacy", token: "safa-demo" }
  ];

  for (const m of demoMerchants) {
    await db
      .insert(merchants)
      .values({
        id: m.id,
        name: m.name,
        token: m.token,
        remittanceCycle: "weekly",
        proofRequirement: "photo+otp",
        codFeePercent: "0.0500",
        deliveryFeeAed: "15.00",
        disputeWindowDays: 7
      })
      .onConflictDoNothing();
  }

  // --- Riders ---
  const demoRiders = [
    { id: "r-hassan", name: "Hassan Ali", zone: "Dubai Marina" },
    { id: "r-umar", name: "Umar Khan", zone: "Deira" },
    { id: "r-faisal", name: "Faisal Ahmed", zone: "JVC" }
  ];

  for (const r of demoRiders) {
    await db
      .insert(riders)
      .values({
        id: r.id,
        name: r.name,
        zone: r.zone,
        status: "off_shift",
        personalFloatAed: "120.00"
      })
      .onConflictDoNothing();
  }

  console.log(
    `Seeded ${demoMerchants.length} merchants and ${demoRiders.length} riders.`
  );
  console.log(
    "To create the first operator, visit http://localhost:3000/sign-up."
  );

  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

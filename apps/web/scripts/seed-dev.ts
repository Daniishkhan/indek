import { config } from "dotenv";
import {
  getDb,
  getPool,
  merchantProfile,
  operatorProfile,
  resetSeedData,
  riderProfile,
  seedDomainData,
  user,
} from "@indek/db";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";

config({ path: ".env.local" });
config({ path: ".env" });

const seededAccounts = {
  operator: {
    email: "danish@indek.test",
    password: "indek1234",
    name: "Danish Khan",
    role: "operator" as const,
  },
  merchant: {
    email: "merchant@indek.test",
    password: "indek1234",
    name: "Bloom Boutique Admin",
    role: "merchant" as const,
    merchantId: "m-bloom",
  },
  rider: {
    email: "rider@indek.test",
    password: "indek1234",
    name: "Hassan Ali",
    role: "rider" as const,
    riderId: "r-hassan",
  },
};

async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: "operator" | "merchant" | "rider";
}) {
  const result = await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    },
  });

  const db = getDb();
  const seededUser = await db.query.user.findFirst({
    where: eq(user.email, input.email),
  });

  if (!seededUser) {
    throw new Error(`Failed to create seeded user for ${input.email}`);
  }

  return { result, user: seededUser };
}

async function main() {
  await resetSeedData();
  const counts = await seedDomainData();

  const operator = await createUser(seededAccounts.operator);
  const merchant = await createUser(seededAccounts.merchant);
  const rider = await createUser(seededAccounts.rider);

  const db = getDb();

  await db.insert(operatorProfile).values({
    userId: operator.user.id,
    displayName: seededAccounts.operator.name,
  });

  await db.insert(merchantProfile).values({
    userId: merchant.user.id,
    merchantId: seededAccounts.merchant.merchantId,
  });

  await db.insert(riderProfile).values({
    userId: rider.user.id,
    riderId: seededAccounts.rider.riderId,
    phone: "+971-50-000-0001",
  });

  console.log("\nSeed complete.");
  console.log(
    `Domain data: ${counts.merchants} merchants, ${counts.riders} riders, ${counts.manifests} manifests, ${counts.parcels} parcels, ${counts.events} events.`,
  );
  console.log("\nSeeded credentials:");
  console.log(
    `- operator admin: ${seededAccounts.operator.email} / ${seededAccounts.operator.password}`,
  );
  console.log(
    `- merchant admin: ${seededAccounts.merchant.email} / ${seededAccounts.merchant.password}`,
  );
  console.log(
    `- rider: ${seededAccounts.rider.email} / ${seededAccounts.rider.password}`,
  );

  await getPool().end();
}

main().catch(async (err) => {
  console.error(err);
  await getPool().end();
  process.exit(1);
});

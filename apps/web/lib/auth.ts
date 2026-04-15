import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@indek/db/client";
import * as schema from "@indek/db/schema";

export const auth = betterAuth({
  appName: "Indek",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // Dev mode: log reset link. Wire Resend/Postmark/SES here for prod.
      console.log("\n━━━ Password reset requested ━━━");
      console.log(`  User:  ${user.email}`);
      console.log(`  Link:  ${url}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "operator",
        input: true
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // refresh daily
  },
  advanced: {
    cookiePrefix: "indek"
  }
});

export type Auth = typeof auth;

import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import { getDb, user } from "@indek/db";
import { getCurrentSession } from "@/lib/session";
import { SignUpForm } from "../sign-up-form";
import { getRoleHome } from "@/lib/role-config";

export default async function OperatorSignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  const db = getDb();
  const [{ c }] = await db
    .select({ c: count() })
    .from(user)
    .where(eq(user.role, "operator"));
  const operatorExists = Number(c) > 0;

  if (operatorExists) {
    return (
      <div className="auth-card">
        <div className="auth-reveal auth-reveal-1">
          <span className="auth-role-hint">Bootstrap closed</span>
          <h1 className="auth-title" style={{ marginTop: 14 }}>
            An operator <span className="accent">already exists</span>
          </h1>
          <p className="auth-desc">
            This instance has been bootstrapped. Additional operators, riders,
            and merchants are created from inside the operator console — not via
            public sign-up.
          </p>
        </div>
        <div className="auth-reveal auth-reveal-2">
          <Link
            href="/sign-in/operator"
            className="auth-submit"
            style={{ textDecoration: "none" }}
          >
            Go to operator sign in
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <span className="auth-role-hint">Operator bootstrap</span>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Create the <span className="accent">first operator</span>
        </h1>
        <p className="auth-desc">
          This is a one-time setup. The first operator becomes the admin for
          this instance and manages everyone else from the console.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <SignUpForm />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Need another route? <Link href="/sign-up">Choose by role</Link>
      </div>
    </div>
  );
}

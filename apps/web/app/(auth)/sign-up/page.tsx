import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthRoleCards } from "../role-cards";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-reveal auth-reveal-1">
        <div className="auth-eyebrow">Onboarding</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Start with the <span className="accent">right role</span>
        </h1>
        <p className="auth-desc">
          Operator bootstrap is public for the first workspace admin. Merchant
          and rider access stay provisioned by the operator team and sign in
          through their own dedicated routes.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <AuthRoleCards mode="sign-up" />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Already set up? <Link href="/sign-in">Go to role sign in</Link>
      </div>
    </div>
  );
}

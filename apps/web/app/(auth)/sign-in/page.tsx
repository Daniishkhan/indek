import { redirect } from "next/navigation";
import { AuthRoleCards } from "../role-cards";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-reveal auth-reveal-1">
        <div className="auth-eyebrow">Choose your route</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Sign in by <span className="accent">workspace role</span>
        </h1>
        <p className="auth-desc">
          Pick the role you are using right now. Each route now has its own
          screen so operator, merchant, and rider access can evolve separately.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <AuthRoleCards mode="sign-in" />
      </div>
    </div>
  );
}

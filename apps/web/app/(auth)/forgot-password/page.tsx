import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import {
  getRoleHome,
  isAppRole,
  roleConfig,
  type AppRole,
} from "@/lib/role-config";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  const { role } = await searchParams;
  const intentRole = role && isAppRole(role) ? (role as AppRole) : undefined;
  const signInHref = intentRole
    ? roleConfig[intentRole].signInPath
    : "/sign-in";

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <div className="auth-eyebrow">Reset flow</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Forgot your <span className="accent">password?</span>
        </h1>
        <p className="auth-desc">
          Enter the email on your Indek account. We&apos;ll send a secure link
          to reset your password. The link expires in one hour.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <ForgotPasswordForm role={intentRole} />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Remembered it? <Link href={signInHref}>Back to sign in</Link>
      </div>
    </div>
  );
}

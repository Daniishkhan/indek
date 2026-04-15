import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "rider" ? "/rider" : role === "merchant" ? "/" : "/operator");
  }

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <div className="auth-eyebrow">Reset flow</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Forgot your <em>password?</em>
        </h1>
        <p className="auth-desc">
          Enter the email on your Indek account. We&apos;ll send a secure link
          to reset your password. The link expires in one hour.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <ForgotPasswordForm />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Remembered it? <Link href="/sign-in">Back to sign in</Link>
      </div>
    </div>
  );
}

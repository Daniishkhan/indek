import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "rider" ? "/rider" : role === "merchant" ? "/" : "/operator");
  }

  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <div className="auth-card">
        <div className="auth-reveal auth-reveal-1">
          <div className="auth-eyebrow">Reset flow</div>
          <h1 className="auth-title" style={{ marginTop: 14 }}>
            This link is <span className="accent">invalid or expired</span>
          </h1>
          <p className="auth-desc">
            Reset links expire after one hour. Request a fresh link below to
            try again.
          </p>
        </div>
        <div className="auth-reveal auth-reveal-2">
          <Link
            href="/forgot-password"
            className="auth-submit"
            style={{ textDecoration: "none" }}
          >
            Request a new link
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
        <div className="auth-eyebrow">Reset flow</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Choose a <span className="accent">new password</span>
        </h1>
        <p className="auth-desc">
          Pick something at least eight characters long. You&apos;ll be signed
          in automatically once it&apos;s set.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <ResetPasswordForm token={token} />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Changed your mind? <Link href="/sign-in">Back to sign in</Link>
      </div>
    </div>
  );
}

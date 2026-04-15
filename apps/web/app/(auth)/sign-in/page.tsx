import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "rider" ? "/rider" : role === "merchant" ? "/" : "/operator");
  }

  const { next } = await searchParams;

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <div className="auth-eyebrow">Welcome back</div>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Sign in to <em>Indek</em>
        </h1>
        <p className="auth-desc">
          Operator, rider, or merchant — use the credentials the ops team set
          up.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <SignInForm next={next} />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Don&apos;t have access yet?{" "}
        <Link href="/sign-up">Bootstrap the first operator</Link>
      </div>
    </div>
  );
}

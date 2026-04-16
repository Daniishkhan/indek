import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome } from "@/lib/role-config";
import { SignUpForm } from "../sign-up-form";

export default async function MerchantSignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <span className="auth-role-hint">Merchant</span>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          Create your <span className="accent">merchant account</span>
        </h1>
        <p className="auth-desc">
          Sign up to access your delivery workspace, submit pickup requests, and
          track parcels and remittance in real time.
        </p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <SignUpForm role="merchant" />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Already have an account?{" "}
        <Link href="/sign-in/merchant">Sign in as merchant</Link>
      </div>
    </div>
  );
}

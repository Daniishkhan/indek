import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignInForm } from "../sign-in-form";
import { getCurrentSession } from "@/lib/session";
import {
  getRoleHome,
  isAppRole,
  roleConfig,
  type AppRole,
} from "@/lib/role-config";

const ROLE_COPY: Record<AppRole, { title: string; description: string }> = {
  operator: {
    title: "Sign in to the control plane",
    description:
      "Use the admin/operator account that manages intake, dispatch, and rider operations.",
  },
  merchant: {
    title: "Sign in to the merchant workspace",
    description:
      "Use the merchant account provisioned by ops to reach your merchant route directly.",
  },
  rider: {
    title: "Sign in to the rider workspace",
    description:
      "Use the rider credentials set up by the operator team for your shift device.",
  },
};

export default async function RoleSignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) {
    const role = (session.user as { role?: string }).role;
    redirect(getRoleHome(role));
  }

  const [{ role }, { next }] = await Promise.all([params, searchParams]);
  if (!isAppRole(role)) {
    notFound();
  }

  const copy = ROLE_COPY[role];

  return (
    <div className="auth-card">
      <div className="auth-reveal auth-reveal-1">
        <span className="auth-role-hint">{roleConfig[role].label}</span>
        <h1 className="auth-title" style={{ marginTop: 14 }}>
          {copy.title}
        </h1>
        <p className="auth-desc">{copy.description}</p>
      </div>

      <div className="auth-reveal auth-reveal-2">
        <SignInForm intentRole={role} next={next} />
      </div>

      <div className="auth-foot auth-reveal auth-reveal-3">
        Need a different route? <Link href="/sign-in">Choose another role</Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { appRoles, roleConfig } from "@/lib/role-config";

export function AuthRoleCards({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <div className="auth-role-grid">
      {appRoles.map((role) => {
        const config = roleConfig[role];
        const href =
          mode === "sign-up"
            ? (config.signUpPath ?? config.signInPath)
            : config.signInPath;
        const helper =
          mode === "sign-up" && !config.signUpPath
            ? "Credentials are provisioned by the operator team."
            : config.description;

        return (
          <Link className="auth-role-card" href={href} key={`${mode}-${role}`}>
            <div className="auth-role-card-head">
              <span className="auth-role-hint">{config.shortLabel}</span>
              <span className="auth-role-arrow">→</span>
            </div>
            <h3>{config.label}</h3>
            <p>{helper}</p>
          </Link>
        );
      })}
    </div>
  );
}

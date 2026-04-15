"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { roleConfig, type AppRole } from "@/lib/role-config";
import { AuthAlert, PasswordToggle, SubmitButton } from "../components";
import { mapAuthError } from "../errors";

export function ResetPasswordForm({
  role,
  token,
}: {
  role?: AppRole;
  token: string;
}) {
  const router = useRouter();
  const pwRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pwRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (res.error) {
      setBusy(false);
      setErr(mapAuthError(res.error));
      return;
    }
    router.push(role ? roleConfig[role].signInPath : "/sign-in");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="password" className="auth-label">
            New password
          </label>
          <span className="auth-hint">Min 8 characters</span>
        </div>
        <div className="auth-input-wrap">
          <input
            ref={pwRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input with-btn"
            disabled={busy}
          />
          <PasswordToggle
            visible={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="confirm" className="auth-label">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="auth-input"
          disabled={busy}
        />
      </div>

      {err && <AuthAlert message={err} />}

      <SubmitButton
        busy={busy}
        label="Set new password"
        busyLabel="Updating…"
      />
    </form>
  );
}

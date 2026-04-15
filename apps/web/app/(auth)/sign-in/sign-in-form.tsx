"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getRoleHome, type AppRole } from "@/lib/role-config";
import { AuthAlert, PasswordToggle, SubmitButton } from "../components";
import { mapAuthError } from "../errors";

export function SignInForm({
  intentRole,
  next,
}: {
  intentRole: AppRole;
  next?: string;
}) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe: remember,
    });
    if (res.error) {
      setBusy(false);
      setErr(mapAuthError(res.error));
      return;
    }
    const role = (res.data?.user as { role?: string } | undefined)?.role;
    const actualHome = getRoleHome(role ?? intentRole);
    const dest = next && role === intentRole ? next : actualHome;
    router.push(dest);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="email" className="auth-label">
            Email address
          </label>
        </div>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@indek.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          disabled={busy}
        />
      </div>

      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <Link
            href={`/forgot-password?role=${intentRole}`}
            className="auth-link"
          >
            Forgot password?
          </Link>
        </div>
        <div className="auth-input-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      <label className="auth-check">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={busy}
        />
        Stay signed in on this device
      </label>

      {err && <AuthAlert message={err} />}

      <SubmitButton busy={busy} label="Sign in" busyLabel="Signing in…" />
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthAlert, PasswordToggle, SubmitButton } from "../components";
import { mapAuthError } from "../errors";

export function SignUpForm() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const res = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      // @ts-expect-error — registered as additional field in server config
      role: "operator"
    });
    if (res.error) {
      setBusy(false);
      setErr(mapAuthError(res.error));
      return;
    }
    router.push("/operator");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="name" className="auth-label">
            Your name
          </label>
        </div>
        <input
          ref={nameRef}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Danish Khan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="auth-input"
          disabled={busy}
        />
      </div>

      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="email" className="auth-label">
            Work email
          </label>
        </div>
        <input
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
          <span className="auth-hint">Min 8 characters</span>
        </div>
        <div className="auth-input-wrap">
          <input
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

      {err && <AuthAlert message={err} />}

      <SubmitButton
        busy={busy}
        label="Create operator account"
        busyLabel="Creating…"
      />
    </form>
  );
}

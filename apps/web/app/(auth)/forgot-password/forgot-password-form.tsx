"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthAlert, SubmitButton } from "../components";
import { mapAuthError } from "../errors";

export function ForgotPasswordForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/reset-password"
    });
    setBusy(false);
    if (res.error) {
      setErr(mapAuthError(res.error));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-form">
        <AuthAlert
          tone="ok"
          message={`If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox — and in dev mode, check the server console.`}
        />
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="auth-link"
          style={{ justifySelf: "start", marginTop: 6 }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <div className="auth-field">
        <label htmlFor="email" className="auth-label">
          Email address
        </label>
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

      {err && <AuthAlert message={err} />}

      <SubmitButton
        busy={busy}
        label="Send reset link"
        busyLabel="Sending…"
      />
    </form>
  );
}

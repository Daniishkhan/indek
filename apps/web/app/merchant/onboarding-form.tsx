"use client";

import { useRef, useEffect } from "react";

export function MerchantOnboardingForm({
  action,
  notice,
}: {
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
}) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <section
      className="panel stack"
      style={{
        maxWidth: 480,
        margin: "auto",
        marginTop: "12vh",
      }}
    >
      <div>
        <div className="eyebrow">Welcome to Indek</div>
        <h2 style={{ margin: 0 }}>Set up your merchant workspace</h2>
        <p>
          Enter your company or brand name to create your workspace. You will
          get a shareable request portal where you can submit delivery requests
          and track them in real time.
        </p>
      </div>

      {notice === "onboarding-missing-name" ? (
        <div className="notice warn">A company or brand name is required.</div>
      ) : null}

      <form action={action} className="stack">
        <label className="form-field">
          <span className="label">Company / brand name</span>
          <input
            ref={nameRef}
            className="input"
            name="companyName"
            type="text"
            required
            placeholder="e.g. Bloom Boutique, Al Noor Pharmacy"
          />
        </label>
        <button className="button" type="submit">
          Set up my workspace
        </button>
      </form>
    </section>
  );
}

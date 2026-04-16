"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutPage() {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        await authClient.signOut();
      } finally {
        router.replace("/");
        router.refresh();
      }
    })();
  }, [router]);

  return <p className="text-sm text-muted-foreground">Signing you out…</p>;
}

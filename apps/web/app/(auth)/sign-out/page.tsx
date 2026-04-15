"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    })();
  }, [router]);

  return (
    <p className="text-sm text-muted-foreground">Signing you out…</p>
  );
}

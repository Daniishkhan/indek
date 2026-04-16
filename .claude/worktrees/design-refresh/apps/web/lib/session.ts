import { headers } from "next/headers";
import { auth } from "./auth";

export type Role = "operator" | "merchant" | "rider";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireRole(role: Role) {
  const s = await getCurrentSession();
  if (!s) return null;
  const userRole = (s.user as { role?: Role }).role;
  if (userRole !== role) return null;
  return s;
}

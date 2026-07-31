import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { requireSession, SessionError } from "@/lib/firebase/auth";

type AdminClaims = DecodedIdToken & {
  role?: unknown;
  admin?: unknown;
  user_metadata?: { role?: unknown };
};

function claimRole(session: DecodedIdToken): string | null {
  const claims = session as AdminClaims;
  if (typeof claims.role === "string") return claims.role;
  if (typeof claims.user_metadata?.role === "string") {
    return claims.user_metadata.role;
  }
  return null;
}

export async function checkIsAdmin(session: DecodedIdToken): Promise<boolean> {
  const claims = session as AdminClaims;
  if (claimRole(session) === "admin" || claims.admin === true) {
    return true;
  }

  const profile = await getFirebaseAdminDb()
    .collection("profiles")
    .doc(session.uid)
    .get();

  if (!profile.exists) return false;

  return profile.get("isAdmin") === true || profile.get("role") === "admin";
}

export async function requireAdmin() {
  const session = await requireSession();
  const ok = await checkIsAdmin(session);
  if (!ok) {
    throw new SessionError("관리자만 접근할 수 있습니다.", 403);
  }
  return session;
}

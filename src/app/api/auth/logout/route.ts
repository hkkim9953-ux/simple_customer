import { NextResponse, type NextRequest } from "next/server";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/env";
import { isTrustedOrigin } from "@/lib/http/origin";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getOptionalSession();
  if (session) {
    await getFirebaseAdminAuth()
      .revokeRefreshTokens(session.uid)
      .catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

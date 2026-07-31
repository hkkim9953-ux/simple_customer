import { NextResponse, type NextRequest } from "next/server";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/env";

function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (
    !isSameOrigin(request.headers.get("origin"), request.headers.get("host"))
  ) {
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

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/firebase/env";

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

  try {
    const body = (await request.json()) as {
      idToken?: unknown;
      name?: unknown;
      phone?: unknown;
    };

    if (typeof body.idToken !== "string" || !body.idToken) {
      return NextResponse.json({ error: "ID token is required." }, { status: 400 });
    }

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken);
    const db = getFirebaseAdminDb();
    const profileRef = db.collection("profiles").doc(decoded.uid);
    const existing = await profileRef.get();

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 80)
        : existing.get("name") ||
          decoded.name ||
          decoded.email?.split("@")[0] ||
          "회원";
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : existing.get("phone") || "";

    await profileRef.set(
      {
        email: decoded.email ?? existing.get("email") ?? "",
        name,
        phone,
        isAdmin: existing.get("isAdmin") === true,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "유효한 Firebase 인증 토큰이 필요합니다." },
      { status: 401 },
    );
  }
}

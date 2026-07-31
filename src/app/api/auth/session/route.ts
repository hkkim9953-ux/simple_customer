import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/firebase/env";

function isTrustedOrigin(request: NextRequest) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  // Same-origin browser requests sometimes omit Origin; Sec-Fetch-Site is enough.
  if (site === "same-origin") return true;

  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer && host) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== "production";
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
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
        role:
          existing.get("role") === "admin" || existing.get("isAdmin") === true
            ? "admin"
            : existing.get("role") || "customer",
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
  } catch (error) {
    console.error("[auth/session]", error);
    return NextResponse.json(
      { error: "서버 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 401 },
    );
  }
}

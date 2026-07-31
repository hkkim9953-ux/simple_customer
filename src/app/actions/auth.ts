"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/env";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signOut() {
  const session = await getOptionalSession();
  if (session) {
    await getFirebaseAdminAuth()
      .revokeRefreshTokens(session.uid)
      .catch(() => undefined);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteAccount(): Promise<AuthActionState> {
  const session = await getOptionalSession();
  if (!session) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    const db = getFirebaseAdminDb();
    const auth = getFirebaseAdminAuth();

    const reservations = await db
      .collection("reservations")
      .where("userId", "==", session.uid)
      .get();

    const batch = db.batch();
    reservations.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection("profiles").doc(session.uid));
    await batch.commit();

    await auth.deleteUser(session.uid);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "계정 삭제에 실패했습니다.";
    return { error: message };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  revalidatePath("/", "layout");
  return { success: "계정이 삭제되었습니다." };
}

"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

async function createServerSession(idToken: string, profile?: {
  name?: string;
  phone?: string;
}) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken, ...profile }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "서버 세션을 만들지 못했습니다.");
  }
}

function toKoreanError(error: unknown): string {
  const code =
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일입니다.";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 합니다.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return error instanceof Error ? error.message : "인증에 실패했습니다.";
  }
}

export async function signInWithFirebase(email: string, password: string) {
  try {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    const idToken = await credential.user.getIdToken();
    await createServerSession(idToken);
  } catch (error) {
    throw new Error(toKoreanError(error));
  }
}

export async function signUpWithFirebase(input: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );
    await updateProfile(credential.user, { displayName: input.name });
    const idToken = await credential.user.getIdToken(true);
    await createServerSession(idToken, {
      name: input.name,
      phone: input.phone,
    });
  } catch (error) {
    throw new Error(toKoreanError(error));
  }
}

export async function signOutWithFirebase() {
  await fetch("/api/auth/logout", { method: "POST" });
  await firebaseSignOut(getFirebaseAuth());
}

import "server-only";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/firebase/client-config";

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

export function getFirebaseAdminConfig() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "simple-customer";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
  }

  return { projectId };
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminConfig } from "@/lib/firebase/env";

export function getFirebaseAdminApp() {
  if (getApps().length) return getApp();

  const config = getFirebaseAdminConfig();
  const credential =
    "clientEmail" in config ? cert(config) : applicationDefault();

  return initializeApp({ credential, projectId: config.projectId });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

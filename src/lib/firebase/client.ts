"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirebaseClientConfig } from "@/lib/firebase/client-config";

export function getFirebaseClientApp() {
  return getApps().length ? getApp() : initializeApp(getFirebaseClientConfig());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseClientApp());
}

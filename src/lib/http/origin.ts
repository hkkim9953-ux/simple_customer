import type { NextRequest } from "next/server";

export function isTrustedOrigin(request: NextRequest) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

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

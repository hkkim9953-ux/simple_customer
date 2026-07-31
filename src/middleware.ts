import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/client-config";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isProtected =
    path === "/mypage" ||
    path.startsWith("/mypage/") ||
    path === "/my-reservations" ||
    path.startsWith("/my-reservations/") ||
    path === "/reserve" ||
    path.startsWith("/reserve/") ||
    path === "/admin" ||
    path.startsWith("/admin/");

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isProtected && !hasSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && hasSession) {
    const redirectUrl = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    redirectUrl.pathname =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
    redirectUrl.search = "";
    if (redirectUrl.pathname === "/mypage") {
      redirectUrl.searchParams.set("notice", "logged-in");
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

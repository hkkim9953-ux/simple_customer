import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/client-config";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
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

  // /login, /signup은 항상 접근 가능
  // (쿠키만 있고 무효인 경우에도 가입 화면이 리다이렉트로 막히지 않도록)
  if (isProtected && !hasSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

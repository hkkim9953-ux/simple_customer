"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/booking", label: "예약하기" },
  { href: "/my-bookings", label: "내 예약" },
  { href: "/admin", label: "관리자" },
] as const;

type HeaderProps = {
  userEmail?: string | null;
};

export default function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLoggedIn = Boolean(userEmail);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
          onClick={() => setOpen(false)}
        >
          SimpleReserve
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  active
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                className={`px-3 py-2 text-sm transition-colors ${
                  pathname === "/mypage"
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                마이페이지
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-background"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                로그인
              </Link>
              <a
                href="/signup"
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              >
                회원가입
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">메뉴</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={`block h-px w-4 bg-foreground transition-transform ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-4 bg-foreground transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px w-4 bg-foreground transition-transform ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-surface px-5 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="모바일 메뉴">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                href="/mypage"
                className="rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
                onClick={() => setOpen(false)}
              >
                마이페이지
              </Link>
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {isLoggedIn ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full rounded-md border border-border px-3 py-2.5 text-center text-sm text-foreground transition-colors hover:bg-background"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2.5 text-center text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  로그인
                </Link>
                <a
                  href="/signup"
                  className="rounded-md bg-foreground px-3 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-80"
                  onClick={() => setOpen(false)}
                >
                  회원가입
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

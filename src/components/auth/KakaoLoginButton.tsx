"use client";

import { useState } from "react";
import { signInWithKakao } from "@/lib/firebase/auth-client";
import { isKakaoConfigured } from "@/lib/kakao/client";

type KakaoLoginButtonProps = {
  nextPath?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export default function KakaoLoginButton({
  nextPath,
  disabled,
  onError,
}: KakaoLoginButtonProps) {
  const [pending, setPending] = useState(false);
  const configured = isKakaoConfigured();

  if (!configured) {
    return (
      <p className="rounded-md border border-border bg-background px-3 py-2.5 text-center text-xs text-muted">
        카카오 로그인을 쓰려면{" "}
        <code className="text-foreground">NEXT_PUBLIC_KAKAO_JS_KEY</code>를
        설정하세요.
      </p>
    );
  }

  async function handleClick() {
    if (pending || disabled) return;
    setPending(true);
    try {
      await signInWithKakao();
      window.sessionStorage.setItem("sr_toast", "login");
      const target =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";
      window.location.assign(target);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "카카오 로그인에 실패했습니다.",
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || disabled}
      className="w-full rounded-md bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "카카오 로그인 중..." : "카카오로 계속하기"}
    </button>
  );
}

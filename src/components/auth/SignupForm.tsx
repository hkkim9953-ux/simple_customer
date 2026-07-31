"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signUpWithFirebase } from "@/lib/firebase/auth-client";

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || success) return;

    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !phone || !email || !password) {
      setError("모든 항목을 입력해 주세요.");
      setPending(false);
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setPending(false);
      return;
    }

    try {
      await signUpWithFirebase({ email, password, name, phone });
      setSuccess(true);
      window.location.assign("/mypage?joined=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={pending || success}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground disabled:opacity-60"
          placeholder="홍길동"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
          전화번호
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          disabled={pending || success}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground disabled:opacity-60"
          placeholder="010-1234-5678"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending || success}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground disabled:opacity-60"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={pending || success}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground disabled:opacity-60"
          placeholder="6자 이상"
        />
      </div>

      <div aria-live="polite" className="min-h-10">
        {error && (
          <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
            {error}
          </p>
        )}
        {(pending || success) && !error && (
          <p className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
            {success
              ? "가입 완료! 마이페이지로 이동합니다…"
              : "계정 생성 중입니다. 잠시만 기다려 주세요…"}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || success}
        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {success ? "이동 중..." : pending ? "가입 중..." : "회원가입"}
      </button>

      <p className="text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-2 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}

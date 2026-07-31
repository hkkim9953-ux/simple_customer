"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signInWithFirebase } from "@/lib/firebase/auth-client";

type LoginFormProps = {
  nextPath?: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || success) return;

    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      setPending(false);
      return;
    }

    try {
      await signInWithFirebase(email, password);
      setSuccess(true);
      const target =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
          autoComplete="current-password"
          required
          minLength={6}
          disabled={pending || success}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground disabled:opacity-60"
          placeholder="••••••••"
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
            {success ? "로그인 성공! 이동합니다…" : "로그인 중입니다…"}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || success}
        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {success ? "이동 중..." : pending ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-2 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}

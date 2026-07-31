"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithFirebase } from "@/lib/firebase/auth-client";

type LoginFormProps = {
  nextPath?: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await signInWithFirebase(email, password);
      router.replace(nextPath && nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground"
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
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "로그인"}
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

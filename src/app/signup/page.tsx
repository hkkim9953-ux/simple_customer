import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
        SimpleReserve
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        회원가입
      </h1>
      <p className="mt-2 text-sm text-muted">
        이메일과 기본 정보를 입력해 계정을 만드세요.
      </p>
      <SignupForm />
      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          메인으로 돌아가기
        </Link>
      </p>
    </main>
  );
}

import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
        SimpleReserve
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        로그인
      </h1>
      <p className="mt-2 text-sm text-muted">
        계정으로 로그인하고 예약을 관리하세요.
      </p>
      <LoginForm nextPath={next} />
      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          메인으로 돌아가기
        </Link>
      </p>
    </main>
  );
}

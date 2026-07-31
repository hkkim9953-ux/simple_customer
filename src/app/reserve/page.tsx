import Link from "next/link";
import { redirect } from "next/navigation";
import ReserveForm from "@/components/reservations/ReserveForm";
import { getOptionalSession } from "@/lib/firebase/auth";

export default async function ReservePage() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login?next=/reserve");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
        SimpleReserve
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        예약하기
      </h1>
      <p className="mt-2 text-sm text-muted">
        원하는 날짜와 시간을 선택해 예약을 남겨 주세요.
      </p>

      <ReserveForm />

      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/my-reservations" className="hover:text-foreground">
          내 예약 보기
        </Link>
      </p>
    </main>
  );
}

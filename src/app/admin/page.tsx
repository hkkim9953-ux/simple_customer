import Link from "next/link";
import { redirect } from "next/navigation";
import AdminBookingForm from "@/components/reservations/AdminBookingForm";
import AdminReservationList from "@/components/reservations/AdminReservationList";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/timestamps";
import {
  normalizeStatus,
  type ReservationWithProfile,
} from "@/types/reservation";

export default async function AdminPage() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login?next=/admin");
  }

  const db = getFirebaseAdminDb();
  const profileSnap = await db.collection("profiles").doc(session.uid).get();

  if (profileSnap.get("isAdmin") !== true) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-20 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          관리자
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          관리자 권한이 없습니다.
        </p>
        <p className="mt-8 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            메인으로 돌아가기
          </Link>
        </p>
      </main>
    );
  }

  let reservations: ReservationWithProfile[] = [];
  let customers: Array<{ id: string; name: string; email: string }> = [];
  let loadError = false;

  try {
    const [reservationSnap, profileSnapAll] = await Promise.all([
      db.collection("reservations").get(),
      db.collection("profiles").get(),
    ]);

    const profiles = new Map<
      string,
      { name: string; email: string; phone: string }
    >();

    customers = profileSnapAll.docs
      .map((doc) => {
        const profile = {
          name: String(doc.get("name") ?? "이름 없음"),
          email: String(doc.get("email") ?? ""),
          phone: String(doc.get("phone") ?? ""),
        };
        profiles.set(doc.id, profile);
        return { id: doc.id, name: profile.name, email: profile.email };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    reservations = reservationSnap.docs
      .map((doc) => {
        const userId = String(doc.get("userId"));
        return {
          id: doc.id,
          userId,
          reservationDate: String(doc.get("reservationDate")),
          reservationTime: String(doc.get("reservationTime")),
          partySize: Number(doc.get("partySize") ?? 1),
          note: String(doc.get("note") ?? ""),
          status: normalizeStatus(doc.get("status")),
          createdAt: timestampToIso(doc.get("createdAt")),
          updatedAt: timestampToIso(doc.get("updatedAt")),
          profile: profiles.get(userId) ?? null,
        };
      })
      .sort((a, b) => {
        const dateCmp = b.reservationDate.localeCompare(a.reservationDate);
        if (dateCmp !== 0) return dateCmp;
        return b.reservationTime.localeCompare(a.reservationTime);
      });
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
        Admin
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        예약 관리
      </h1>
      <p className="mt-2 text-sm text-muted">
        전체 예약을 조회·등록·취소할 수 있습니다.
      </p>

      <AdminBookingForm customers={customers} />

      {loadError ? (
        <p className="mt-8 rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          예약 목록을 불러오지 못했습니다.
        </p>
      ) : (
        <AdminReservationList reservations={reservations} />
      )}
    </main>
  );
}

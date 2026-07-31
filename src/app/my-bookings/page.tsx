import Link from "next/link";
import { redirect } from "next/navigation";
import MyBookingCards from "@/components/reservations/MyBookingCards";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/timestamps";
import { normalizeStatus, type Reservation } from "@/types/reservation";

export default async function MyBookingsPage() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login?next=/my-bookings");
  }

  let reservations: Reservation[] = [];
  let loadError = false;

  try {
    const snap = await getFirebaseAdminDb()
      .collection("reservations")
      .where("userId", "==", session.uid)
      .get();

    reservations = snap.docs
      .map((doc) => ({
        id: doc.id,
        userId: String(doc.get("userId")),
        customerName: String(doc.get("customerName") ?? ""),
        customerPhone: String(doc.get("customerPhone") ?? ""),
        reservationDate: String(doc.get("reservationDate")),
        reservationTime: String(doc.get("reservationTime")),
        partySize: Number(doc.get("partySize") ?? 1),
        note: String(doc.get("note") ?? ""),
        status: normalizeStatus(doc.get("status")),
        createdAt: timestampToIso(doc.get("createdAt")),
        updatedAt: timestampToIso(doc.get("updatedAt")),
      }))
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.15em] text-muted uppercase">
            SimpleReserve
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            내 예약 내역
          </h1>
          <p className="mt-2 text-sm text-muted">
            신청한 예약을 확인하고 필요하면 취소할 수 있습니다.
          </p>
        </div>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
        >
          새 예약
        </Link>
      </div>

      {loadError ? (
        <p className="mt-8 rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          예약 목록을 불러오지 못했습니다.
        </p>
      ) : (
        <MyBookingCards reservations={reservations} />
      )}
    </main>
  );
}

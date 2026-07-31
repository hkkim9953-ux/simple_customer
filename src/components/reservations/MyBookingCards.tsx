"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelMyReservation } from "@/app/actions/reservations";
import {
  STATUS_LABELS,
  isActiveReservation,
  type Reservation,
  type ReservationStatus,
} from "@/types/reservation";

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        status === "CONFIRMED"
          ? "bg-foreground text-white"
          : status === "CANCELLED"
            ? "bg-background text-muted"
            : "border border-border text-foreground"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

type MyBookingCardsProps = {
  reservations: Reservation[];
};

export default function MyBookingCards({ reservations }: MyBookingCardsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string) {
    setError(null);
    setPendingId(id);
    setConfirmId(null);
    startTransition(async () => {
      const result = await cancelMyReservation(id);
      if (result.error) {
        setError(result.error);
      }
      setPendingId(null);
      router.refresh();
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="mt-10 text-sm text-muted">아직 등록된 예약이 없습니다.</p>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {reservations.map((item) => {
          const canCancel = isActiveReservation(item.status);
          const busy = isPending && pendingId === item.id;

          return (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.reservationDate}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {item.reservationTime}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {item.note ? (
                <p className="mt-4 text-sm text-muted">{item.note}</p>
              ) : (
                <p className="mt-4 text-sm text-muted">요청사항 없음</p>
              )}

              {canCancel && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmId(item.id)}
                  className="mt-5 w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-50"
                >
                  {busy ? "취소 중..." : "예약 취소"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {confirmId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-booking-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
            <h2
              id="cancel-booking-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              예약 취소
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              이 예약을 취소할까요? 취소 후 상태는 ‘취소’로 변경됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground hover:bg-background disabled:opacity-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmId)}
                disabled={isPending}
                className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white hover:opacity-85 disabled:opacity-50"
              >
                {isPending ? "취소 중..." : "취소하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

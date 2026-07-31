"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelMyReservation } from "@/app/actions/reservations";
import {
  STATUS_LABELS,
  type Reservation,
  type ReservationStatus,
} from "@/types/reservation";

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        status === "confirmed"
          ? "bg-foreground text-white"
          : status === "cancelled"
            ? "bg-background text-muted"
            : "border border-border text-foreground"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

type MyReservationListProps = {
  reservations: Reservation[];
};

export default function MyReservationList({
  reservations,
}: MyReservationListProps) {
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
    <div className="mt-8 space-y-3">
      {error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border border-y border-border">
        {reservations.map((item) => {
          const canCancel =
            item.status === "pending" || item.status === "confirmed";
          const busy = isPending && pendingId === item.id;

          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.reservationDate} {item.reservationTime}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {item.partySize}명
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>

              {canCancel && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmId(item.id)}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-50"
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
          aria-labelledby="cancel-reservation-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
            <h2
              id="cancel-reservation-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              예약 취소
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              이 예약을 취소할까요? 취소 후에는 상태를 되돌릴 수 없습니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmId)}
                disabled={isPending}
                className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
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

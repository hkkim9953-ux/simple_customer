"use client";

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
          ? "bg-foreground text-surface"
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
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string) {
    if (!window.confirm("이 예약을 취소할까요?")) return;

    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await cancelMyReservation(id);
      if (result.error) {
        setError(result.error);
      }
      setPendingId(null);
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
        <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
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
                  onClick={() => handleCancel(item.id)}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-50"
                >
                  {busy ? "취소 중..." : "예약 취소"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

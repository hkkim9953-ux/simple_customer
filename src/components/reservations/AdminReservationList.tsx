"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateReservationStatus } from "@/app/actions/reservations";
import {
  STATUS_LABELS,
  isActiveReservation,
  type ReservationStatus,
  type ReservationWithProfile,
} from "@/types/reservation";

type AdminReservationListProps = {
  reservations: ReservationWithProfile[];
};

export default function AdminReservationList({
  reservations,
}: AdminReservationListProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatus(id: string, status: ReservationStatus) {
    setError(null);
    setMessage(null);
    setPendingKey(`${id}:${status}`);
    startTransition(async () => {
      const result = await updateReservationStatus(id, status);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setMessage(result.success);
      }
      setPendingKey(null);
      router.refresh();
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="mt-10 text-sm text-muted">등록된 예약이 없습니다.</p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground">
          {message}
        </p>
      )}

      <ul className="divide-y divide-border border-y border-border">
        {reservations.map((item) => {
          const profile = item.profile;
          return (
            <li key={item.id} className="space-y-3 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.reservationDate} {item.reservationTime} ·{" "}
                    {item.partySize}명
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {profile?.name ?? "이름 없음"}
                    {profile?.email ? ` · ${profile.email}` : ""}
                    {profile?.phone ? ` · ${profile.phone}` : ""}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-sm text-muted">{item.note}</p>
                  ) : null}
                </div>
                <span className="text-xs font-medium tracking-wide text-muted">
                  {STATUS_LABELS[item.status]} ({item.status})
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["CONFIRMED", "확정"],
                    ["PENDING", "대기"],
                    ["CANCELLED", "취소"],
                  ] as const
                ).map(([status, label]) => {
                  const busy =
                    isPending && pendingKey === `${item.id}:${status}`;
                  const active = item.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={busy || active}
                      onClick={() => handleStatus(item.id, status)}
                      className={`rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                        active
                          ? "bg-foreground text-white"
                          : "border border-border text-foreground hover:bg-background"
                      }`}
                    >
                      {busy ? "변경 중..." : label}
                    </button>
                  );
                })}
                {isActiveReservation(item.status) && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatus(item.id, "CANCELLED")}
                    className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-background disabled:opacity-50"
                  >
                    예약 취소
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

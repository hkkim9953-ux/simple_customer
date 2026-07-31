"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminReservation,
  updateReservationStatus,
  type ReservationActionState,
} from "@/app/actions/reservations";
import {
  STATUS_LABELS,
  TIME_SLOTS,
  type ReservationWithProfile,
} from "@/types/reservation";

const initialState: ReservationActionState = {};

function minDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

type AdminDashboardProps = {
  reservations: ReservationWithProfile[];
};

export default function AdminDashboard({ reservations }: AdminDashboardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, formAction, formPending] = useActionState(
    createAdminReservation,
    initialState,
  );

  useEffect(() => {
    if (formState.success) {
      setMessage(formState.success);
      setModalOpen(false);
      router.refresh();
    }
  }, [formState.success, router]);

  function handleStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
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

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">총 {reservations.length}건</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
        >
          예약 등록
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {error}
        </p>
      )}
      {(message || formState.error) && (
        <p
          className={`rounded-md border px-3 py-2.5 text-sm ${
            formState.error
              ? "border-foreground/30 bg-foreground text-white"
              : "border-border bg-background text-foreground"
          }`}
        >
          {formState.error || message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">고객명</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">예약일시</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reservations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-muted"
                >
                  등록된 예약이 없습니다.
                </td>
              </tr>
            ) : (
              reservations.map((item) => {
                const name =
                  item.customerName ||
                  item.profile?.name ||
                  "이름 없음";
                const phone =
                  item.customerPhone ||
                  item.profile?.phone ||
                  "-";
                const approveBusy =
                  isPending && pendingKey === `${item.id}:CONFIRMED`;
                const cancelBusy =
                  isPending && pendingKey === `${item.id}:CANCELLED`;

                return (
                  <tr key={item.id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {name}
                    </td>
                    <td className="px-4 py-3 text-muted">{phone}</td>
                    <td className="px-4 py-3 text-foreground">
                      {item.reservationDate} {item.reservationTime}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {STATUS_LABELS[item.status]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            approveBusy ||
                            item.status === "CONFIRMED" ||
                            item.status === "CANCELLED"
                          }
                          onClick={() => handleStatus(item.id, "CONFIRMED")}
                          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-40"
                        >
                          {approveBusy ? "처리 중..." : "예약 승인"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            cancelBusy || item.status === "CANCELLED"
                          }
                          onClick={() => handleStatus(item.id, "CANCELLED")}
                          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-background disabled:opacity-40"
                        >
                          {cancelBusy ? "처리 중..." : "예약 취소"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-booking-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
            <h2
              id="admin-booking-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              예약 등록
            </h2>
            <p className="mt-2 text-sm text-muted">
              현장/전화 예약을 직접 등록합니다. 등록 시 상태는 확정으로
              저장됩니다.
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="customer_name"
                  className="block text-sm font-medium text-foreground"
                >
                  고객명
                </label>
                <input
                  id="customer_name"
                  name="customer_name"
                  type="text"
                  required
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label
                  htmlFor="customer_phone"
                  className="block text-sm font-medium text-foreground"
                >
                  연락처
                </label>
                <input
                  id="customer_phone"
                  name="customer_phone"
                  type="tel"
                  required
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
                  placeholder="010-1234-5678"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reservation_date"
                    className="block text-sm font-medium text-foreground"
                  >
                    날짜
                  </label>
                  <input
                    id="reservation_date"
                    name="reservation_date"
                    type="date"
                    required
                    min={minDate()}
                    className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reservation_time"
                    className="block text-sm font-medium text-foreground"
                  >
                    시간
                  </label>
                  <select
                    id="reservation_time"
                    name="reservation_time"
                    required
                    defaultValue=""
                    className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="block text-sm font-medium text-foreground"
                >
                  메모 <span className="font-normal text-muted">(선택)</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  maxLength={500}
                  className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
                />
              </div>

              {formState.error && (
                <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
                  {formState.error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formPending}
                  className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground hover:bg-background disabled:opacity-50"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={formPending}
                  className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white hover:opacity-85 disabled:opacity-50"
                >
                  {formPending ? "등록 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

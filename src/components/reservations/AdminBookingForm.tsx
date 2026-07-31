"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminReservation,
  type ReservationActionState,
} from "@/app/actions/reservations";
import { TIME_SLOTS } from "@/types/reservation";

const initialState: ReservationActionState = {};

type CustomerOption = {
  id: string;
  name: string;
  email: string;
};

type AdminBookingFormProps = {
  customers: CustomerOption[];
};

function minDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function AdminBookingForm({ customers }: AdminBookingFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createAdminReservation,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      className="mt-8 space-y-4 rounded-lg border border-border bg-surface p-5"
    >
      <h2 className="text-base font-semibold text-foreground">예약 등록</h2>

      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-foreground">
          고객
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          defaultValue=""
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
        >
          <option value="" disabled>
            고객을 선택하세요
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email || "이메일 없음"})
            </option>
          ))}
        </select>
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
              시간 선택
            </option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="party_size"
            className="block text-sm font-medium text-foreground"
          >
            인원
          </label>
          <input
            id="party_size"
            name="party_size"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            상태
          </label>
          <select
            id="status"
            name="status"
            defaultValue="CONFIRMED"
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
          >
            <option value="PENDING">대기</option>
            <option value="CONFIRMED">확정</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-foreground">
          메모
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || customers.length === 0}
        className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "등록 중..." : "예약 등록"}
      </button>
    </form>
  );
}

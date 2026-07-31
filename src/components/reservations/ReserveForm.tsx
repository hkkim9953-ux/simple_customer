"use client";

import { useActionState } from "react";
import {
  createReservation,
  type ReservationActionState,
} from "@/app/actions/reservations";
import { TIME_SLOTS } from "@/types/reservation";

const initialState: ReservationActionState = {};

function minDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ReserveForm() {
  const [state, formAction, pending] = useActionState(
    createReservation,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
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
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
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
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
        >
          <option value="" disabled>
            시간을 선택하세요
          </option>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

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
          required
          min={1}
          max={20}
          defaultValue={2}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
        />
      </div>

      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-foreground"
        >
          요청사항 <span className="font-normal text-muted">(선택)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="알레르기, 좌석 요청 등"
          className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "예약 중..." : "예약하기"}
      </button>
    </form>
  );
}

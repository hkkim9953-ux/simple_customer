"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createReservation,
  getBookedTimesForDate,
  type ReservationActionState,
} from "@/app/actions/reservations";
import DateCalendar from "@/components/reservations/DateCalendar";
import { TIME_SLOTS } from "@/types/reservation";

const initialState: ReservationActionState = {};

function minDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function BookingForm() {
  const [state, formAction, pending] = useActionState(
    createReservation,
    initialState,
  );
  const today = minDate();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setTime("");

    getBookedTimesForDate(date)
      .then((times) => {
        if (!cancelled) setBookedTimes(times);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="reservation_date" value={date} />
      <input type="hidden" name="reservation_time" value={time} />
      <input type="hidden" name="party_size" value="1" />

      <div>
        <p className="text-sm font-medium text-foreground">날짜 선택</p>
        <div className="mt-3">
          <DateCalendar
            value={date}
            onChange={setDate}
            minDate={today}
          />
        </div>
        <p className="mt-2 text-xs text-muted">선택일: {date}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">시간대 선택</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TIME_SLOTS.map((slot) => {
            const booked = bookedTimes.includes(slot);
            const active = time === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={booked || loadingSlots}
                onClick={() => setTime(slot)}
                className={`rounded-md px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "bg-foreground text-white"
                    : "border border-border text-foreground hover:bg-background"
                }`}
              >
                {slot}
                {booked ? " · 마감" : ""}
              </button>
            );
          })}
        </div>
        {loadingSlots ? (
          <p className="mt-2 text-xs text-muted">예약 가능 시간 확인 중…</p>
        ) : bookedTimes.length === TIME_SLOTS.length ? (
          <p className="mt-2 text-xs text-muted">
            선택한 날짜는 예약 가능한 시간이 없습니다.
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-foreground"
        >
          메모 / 요청사항
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          maxLength={500}
          placeholder="요청사항이 있으면 적어 주세요."
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
        disabled={pending || !date || !time}
        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "예약 중..." : "예약하기"}
      </button>
    </form>
  );
}

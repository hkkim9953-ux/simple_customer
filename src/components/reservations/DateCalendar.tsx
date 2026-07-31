"use client";

import { useMemo, useState } from "react";

type DateCalendarProps = {
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
};

function toISODate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export default function DateCalendar({
  value,
  onChange,
  minDate,
}: DateCalendarProps) {
  const selected = value ? parseISODate(value) : new Date();
  const [cursor, setCursor] = useState(() => startOfMonth(selected));
  const min = minDate ? parseISODate(minDate) : null;

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();

    const cells: Array<{ iso: string; day: number; inMonth: boolean } | null> =
      [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      cells.push({
        iso: toISODate(date),
        day,
        inMonth: true,
      });
    }

    return cells;
  }, [cursor]);

  const title = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
            )
          }
          className="rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground hover:bg-background"
          aria-label="이전 달"
        >
          ←
        </button>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button
          type="button"
          onClick={() =>
            setCursor(
              new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
            )
          }
          className="rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground hover:bg-background"
          aria-label="다음 달"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-10" />;
          }

          const disabled = Boolean(min && parseISODate(cell.iso) < min);
          const selectedDay = cell.iso === value;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              className={`h-10 rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                selectedDay
                  ? "bg-foreground text-white"
                  : "text-foreground hover:bg-background"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

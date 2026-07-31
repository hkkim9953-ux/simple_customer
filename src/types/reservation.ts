export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type Reservation = {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  note: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReservationWithProfile = Reservation & {
  profile: {
    name: string;
    email: string;
    phone: string;
  } | null;
};

export const TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  CANCELLED: "취소",
};

/** 기존 소문자 상태값과 신규 대문자 상태를 모두 정규화 */
export function normalizeStatus(raw: unknown): ReservationStatus {
  const value = String(raw ?? "PENDING").trim().toUpperCase();
  if (value === "PENDING" || value === "CONFIRMED" || value === "CANCELLED") {
    return value;
  }
  return "PENDING";
}

export function isActiveReservation(status: ReservationStatus) {
  return status === "PENDING" || status === "CONFIRMED";
}

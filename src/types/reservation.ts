export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type Reservation = {
  id: string;
  userId: string;
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
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
};

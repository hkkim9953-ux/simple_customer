"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession, SessionError } from "@/lib/firebase/auth";
import { requireAdmin } from "@/lib/firebase/admin-auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  RESERVATION_STATUSES,
  TIME_SLOTS,
  normalizeStatus,
  type ReservationStatus,
} from "@/types/reservation";

export type ReservationActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidTimeSlot(value: string) {
  return (TIME_SLOTS as readonly string[]).includes(value);
}

function isValidStatus(value: string): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(
    value as ReservationStatus,
  );
}

function todayLocalISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function revalidateBookingPaths() {
  revalidatePath("/booking");
  revalidatePath("/my-bookings");
  revalidatePath("/reserve");
  revalidatePath("/my-reservations");
  revalidatePath("/admin");
}

export async function createReservation(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession();
    const reservationDate = getString(formData, "reservation_date");
    const reservationTime = getString(formData, "reservation_time");
    const note = getString(formData, "note");
    const partySizeRaw = getString(formData, "party_size") || "1";
    const partySize = Number(partySizeRaw);

    if (!reservationDate || !reservationTime) {
      return { error: "날짜와 시간을 선택해 주세요." };
    }
    if (!isValidTimeSlot(reservationTime)) {
      return { error: "선택할 수 없는 시간입니다." };
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return { error: "인원은 1~20명까지 가능합니다." };
    }
    if (reservationDate < todayLocalISODate()) {
      return { error: "지난 날짜로는 예약할 수 없습니다." };
    }
    if (note.length > 500) {
      return { error: "메모는 500자 이내로 작성해 주세요." };
    }

    const profile = await getFirebaseAdminDb()
      .collection("profiles")
      .doc(session.uid)
      .get();

    await getFirebaseAdminDb().collection("reservations").add({
      userId: session.uid,
      customerName: String(profile.get("name") ?? session.name ?? "회원"),
      customerPhone: String(profile.get("phone") ?? ""),
      reservationDate,
      reservationTime,
      partySize,
      note,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateBookingPaths();
    redirect("/my-bookings");
  } catch (error) {
    if (error instanceof SessionError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function createAdminReservation(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const admin = await requireAdmin();
    const customerName = getString(formData, "customer_name");
    const customerPhone = getString(formData, "customer_phone");
    const reservationDate = getString(formData, "reservation_date");
    const reservationTime = getString(formData, "reservation_time");
    const note = getString(formData, "note");

    if (!customerName) {
      return { error: "고객명을 입력해 주세요." };
    }
    if (!customerPhone) {
      return { error: "연락처를 입력해 주세요." };
    }
    if (!reservationDate || !reservationTime) {
      return { error: "날짜와 시간을 선택해 주세요." };
    }
    if (!isValidTimeSlot(reservationTime)) {
      return { error: "선택할 수 없는 시간입니다." };
    }
    if (reservationDate < todayLocalISODate()) {
      return { error: "지난 날짜로는 예약할 수 없습니다." };
    }
    if (note.length > 500) {
      return { error: "메모는 500자 이내로 작성해 주세요." };
    }

    await getFirebaseAdminDb().collection("reservations").add({
      userId: "",
      customerName: customerName.slice(0, 80),
      customerPhone: customerPhone.slice(0, 40),
      reservationDate,
      reservationTime,
      partySize: 1,
      note,
      status: "CONFIRMED",
      createdByAdminId: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateBookingPaths();
    return { success: "예약을 등록했습니다." };
  } catch (error) {
    if (error instanceof SessionError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "등록에 실패했습니다.",
    };
  }
}

export async function cancelMyReservation(
  reservationId: string,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession();
    if (!reservationId) {
      return { error: "예약 정보가 없습니다." };
    }

    const ref = getFirebaseAdminDb()
      .collection("reservations")
      .doc(reservationId);
    const snap = await ref.get();

    if (!snap.exists || snap.get("userId") !== session.uid) {
      return { error: "예약을 찾을 수 없습니다." };
    }

    const current = normalizeStatus(snap.get("status"));
    if (current === "CANCELLED") {
      return { error: "이미 취소된 예약입니다." };
    }

    await ref.update({
      status: "CANCELLED",
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateBookingPaths();
    return { success: "예약이 취소되었습니다." };
  } catch (error) {
    if (error instanceof SessionError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "취소에 실패했습니다.",
    };
  }
}

export async function updateReservationStatus(
  reservationId: string,
  status: string,
): Promise<ReservationActionState> {
  try {
    await requireAdmin();
    const nextStatus = normalizeStatus(status);
    if (!reservationId || !isValidStatus(nextStatus)) {
      return { error: "잘못된 요청입니다." };
    }

    const ref = getFirebaseAdminDb()
      .collection("reservations")
      .doc(reservationId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { error: "예약을 찾을 수 없습니다." };
    }

    await ref.update({
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidateBookingPaths();
    return { success: "예약 상태가 변경되었습니다." };
  } catch (error) {
    if (error instanceof SessionError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "상태 변경에 실패했습니다.",
    };
  }
}

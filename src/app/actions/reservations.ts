"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession, SessionError } from "@/lib/firebase/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  RESERVATION_STATUSES,
  TIME_SLOTS,
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
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

function todayLocalISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

async function requireAdmin() {
  const session = await requireSession();
  const profile = await getFirebaseAdminDb()
    .collection("profiles")
    .doc(session.uid)
    .get();

  if (profile.get("isAdmin") !== true) {
    throw new SessionError("관리자만 접근할 수 있습니다.", 403);
  }

  return session;
}

export async function createReservation(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession();
    const reservationDate = getString(formData, "reservation_date");
    const reservationTime = getString(formData, "reservation_time");
    const partySizeRaw = getString(formData, "party_size");
    const note = getString(formData, "note");
    const partySize = Number(partySizeRaw);

    if (!reservationDate || !reservationTime || !partySizeRaw) {
      return { error: "날짜, 시간, 인원을 입력해 주세요." };
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

    await getFirebaseAdminDb().collection("reservations").add({
      userId: session.uid,
      reservationDate,
      reservationTime,
      partySize,
      note,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/my-reservations");
    revalidatePath("/admin");
    redirect("/my-reservations");
  } catch (error) {
    if (error instanceof SessionError) {
      return { error: error.message };
    }
    throw error;
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
    if (snap.get("status") === "cancelled") {
      return { error: "이미 취소된 예약입니다." };
    }

    await ref.update({
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/my-reservations");
    revalidatePath("/admin");
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
    if (!reservationId || !isValidStatus(status)) {
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
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/admin");
    revalidatePath("/my-reservations");
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

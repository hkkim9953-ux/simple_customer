"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
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

class SlotConflictError extends Error {
  constructor(message = "이미 예약된 시간대입니다. 다른 시간을 선택해 주세요.") {
    super(message);
    this.name = "SlotConflictError";
  }
}

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

function slotDocId(date: string, time: string) {
  return `${date}_${time}`;
}

function slotRef(db: Firestore, date: string, time: string) {
  return db.collection("reservation_slots").doc(slotDocId(date, time));
}

async function getActiveBookedTimes(reservationDate: string) {
  const db = getFirebaseAdminDb();
  const [reservationSnap, slotSnap] = await Promise.all([
    db
      .collection("reservations")
      .where("reservationDate", "==", reservationDate)
      .get(),
    db
      .collection("reservation_slots")
      .where("reservationDate", "==", reservationDate)
      .get(),
  ]);

  const times = new Set<string>();

  for (const doc of reservationSnap.docs) {
    if (normalizeStatus(doc.get("status")) !== "CANCELLED") {
      times.add(String(doc.get("reservationTime")));
    }
  }

  for (const doc of slotSnap.docs) {
    times.add(String(doc.get("reservationTime")));
  }

  return [...times];
}

export async function getBookedTimesForDate(date: string): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  try {
    await requireSession();
    return await getActiveBookedTimes(date);
  } catch {
    return [];
  }
}

type CreateLockedReservationInput = {
  userId: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  note: string;
  status: ReservationStatus;
  createdByAdminId?: string;
};

async function createLockedReservation(input: CreateLockedReservationInput) {
  const db = getFirebaseAdminDb();
  const reservationRef = db.collection("reservations").doc();
  const lockRef = slotRef(db, input.reservationDate, input.reservationTime);

  await db.runTransaction(async (tx) => {
    const lockSnap = await tx.get(lockRef);
    if (lockSnap.exists) {
      throw new SlotConflictError();
    }

    tx.set(reservationRef, {
      userId: input.userId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      partySize: input.partySize,
      note: input.note,
      status: input.status,
      slotId: slotDocId(input.reservationDate, input.reservationTime),
      ...(input.createdByAdminId
        ? { createdByAdminId: input.createdByAdminId }
        : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(lockRef, {
      reservationId: reservationRef.id,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      status: "LOCKED",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return reservationRef.id;
}

async function releaseSlotLock(date: string, time: string, reservationId: string) {
  const db = getFirebaseAdminDb();
  const lockRef = slotRef(db, date, time);

  await db.runTransaction(async (tx) => {
    const lockSnap = await tx.get(lockRef);
    if (!lockSnap.exists) return;

    const owner = String(lockSnap.get("reservationId") ?? "");
    if (owner && owner !== reservationId) return;

    tx.delete(lockRef);
  });
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

    await createLockedReservation({
      userId: session.uid,
      customerName: String(profile.get("name") ?? session.name ?? "회원"),
      customerPhone: String(profile.get("phone") ?? ""),
      reservationDate,
      reservationTime,
      partySize,
      note,
      status: "PENDING",
    });

    revalidateBookingPaths();
    redirect("/my-bookings?toast=booked");
  } catch (error) {
    if (error instanceof SlotConflictError) {
      return { error: error.message };
    }
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

    await createLockedReservation({
      userId: "",
      customerName: customerName.slice(0, 80),
      customerPhone: customerPhone.slice(0, 40),
      reservationDate,
      reservationTime,
      partySize: 1,
      note,
      status: "CONFIRMED",
      createdByAdminId: admin.uid,
    });

    revalidateBookingPaths();
    return { success: "예약을 등록했습니다." };
  } catch (error) {
    if (error instanceof SlotConflictError) {
      return { error: error.message };
    }
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

    await releaseSlotLock(
      String(snap.get("reservationDate")),
      String(snap.get("reservationTime")),
      reservationId,
    );

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

    const previous = normalizeStatus(snap.get("status"));
    const date = String(snap.get("reservationDate"));
    const time = String(snap.get("reservationTime"));

    if (nextStatus !== "CANCELLED" && previous === "CANCELLED") {
      // 취소된 예약을 다시 살릴 때도 슬롯 충돌을 막습니다.
      try {
        const db = getFirebaseAdminDb();
        const lockRef = slotRef(db, date, time);
        await db.runTransaction(async (tx) => {
          const lockSnap = await tx.get(lockRef);
          if (lockSnap.exists) {
            const owner = String(lockSnap.get("reservationId") ?? "");
            if (owner !== reservationId) {
              throw new SlotConflictError();
            }
          } else {
            tx.set(lockRef, {
              reservationId,
              reservationDate: date,
              reservationTime: time,
              status: "LOCKED",
              createdAt: FieldValue.serverTimestamp(),
            });
          }
          tx.update(ref, {
            status: nextStatus,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
      } catch (error) {
        if (error instanceof SlotConflictError) {
          return { error: error.message };
        }
        throw error;
      }
    } else {
      await ref.update({
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (nextStatus === "CANCELLED") {
        await releaseSlotLock(date, time, reservationId);
      }
    }

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

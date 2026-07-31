"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";

const TOAST_MESSAGES: Record<string, string> = {
  login: "로그인되었습니다.",
  signup: "회원가입이 완료되었습니다.",
  booked: "예약이 완료되었습니다.",
  cancelled: "예약이 취소되었습니다.",
  approved: "예약을 승인했습니다.",
  admin_booked: "예약을 등록했습니다.",
};

export default function AppToaster() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fromQuery = searchParams.get("toast");
    const fromStorage =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("sr_toast")
        : null;

    const key = fromQuery || fromStorage;
    if (!key) return;

    const message = TOAST_MESSAGES[key];
    if (message) {
      toast.success(message);
    }

    if (fromStorage) {
      window.sessionStorage.removeItem("sr_toast");
    }

    if (fromQuery) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}

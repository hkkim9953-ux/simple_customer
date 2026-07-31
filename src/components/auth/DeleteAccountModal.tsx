"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/auth";
import { signOutWithFirebase } from "@/lib/firebase/auth-client";

type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function DeleteAccountModal({
  open,
  onClose,
}: DeleteAccountModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
        return;
      }

      try {
        await signOutWithFirebase();
      } catch {
        // 서버에서 이미 계정/세션을 정리한 뒤일 수 있음
      }

      window.location.assign("/");
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2
          id="delete-account-title"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          회원탈퇴
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          정말 탈퇴하시겠습니까? 계정과 관련된 예약·프로필 데이터가 모두
          삭제되며, 이 작업은 되돌릴 수 없습니다.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-foreground/30 bg-foreground px-3 py-2.5 text-sm text-white">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {pending ? "처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

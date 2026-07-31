"use client";

import { useState } from "react";
import DeleteAccountModal from "@/components/auth/DeleteAccountModal";
import type { Profile } from "@/types/profile";

type MyPageClientProps = {
  profile: Profile;
};

export default function MyPageClient({ profile }: MyPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const fields = [
    { label: "이름", value: profile.name },
    { label: "이메일", value: profile.email },
    { label: "전화번호", value: profile.phone },
    {
      label: "가입일",
      value: new Date(profile.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  return (
    <>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <dt className="text-sm text-muted">{field.label}</dt>
            <dd className="text-sm font-medium text-foreground">{field.value}</dd>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          회원탈퇴
        </button>
      </div>

      <DeleteAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

import { redirect } from "next/navigation";
import MyPageClient from "@/components/auth/MyPageClient";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/timestamps";
import type { Profile } from "@/types/profile";

export default async function MyPage() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login?next=/mypage");
  }

  const snap = await getFirebaseAdminDb()
    .collection("profiles")
    .doc(session.uid)
    .get();

  const profile: Profile = snap.exists
    ? {
        id: session.uid,
        email: String(snap.get("email") ?? session.email ?? ""),
        name: String(snap.get("name") ?? "이름 없음"),
        phone: String(snap.get("phone") ?? "-"),
        isAdmin: snap.get("isAdmin") === true,
        created_at: timestampToIso(snap.get("createdAt")),
        updated_at: timestampToIso(snap.get("updatedAt")),
      }
    : {
        id: session.uid,
        email: session.email ?? "",
        name: session.name || "이름 없음",
        phone: "-",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        마이페이지
      </h1>
      <p className="mt-2 text-sm text-muted">계정 정보를 확인합니다.</p>
      <MyPageClient profile={profile} />
    </main>
  );
}

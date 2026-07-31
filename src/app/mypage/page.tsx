import { redirect } from "next/navigation";
import MyPageClient from "@/components/auth/MyPageClient";
import { getOptionalSession } from "@/lib/firebase/auth";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/timestamps";
import type { Profile } from "@/types/profile";

type MyPageProps = {
  searchParams?: Promise<{ joined?: string; notice?: string }>;
};

export default async function MyPage({ searchParams }: MyPageProps) {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login?next=/mypage");
  }

  const params = searchParams ? await searchParams : {};
  const justJoined = params.joined === "1";
  const alreadyLoggedIn = params.notice === "logged-in";

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
      {justJoined && (
        <p className="mt-6 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
          회원가입이 완료되었습니다. 환영합니다!
        </p>
      )}
      {alreadyLoggedIn && !justJoined && (
        <p className="mt-6 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
          이미 로그인되어 있습니다. 다른 계정으로 가입하려면 먼저 로그아웃해 주세요.
        </p>
      )}
      <MyPageClient profile={profile} />
    </main>
  );
}

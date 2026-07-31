import { NextResponse, type NextRequest } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { isTrustedOrigin } from "@/lib/http/origin";

type KakaoUserResponse = {
  id?: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { accessToken?: unknown };
    if (typeof body.accessToken !== "string" || !body.accessToken) {
      return NextResponse.json(
        { error: "카카오 액세스 토큰이 필요합니다." },
        { status: 400 },
      );
    }

    const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      cache: "no-store",
    });

    if (!kakaoRes.ok) {
      return NextResponse.json(
        { error: "카카오 사용자 정보를 확인하지 못했습니다." },
        { status: 401 },
      );
    }

    const kakaoUser = (await kakaoRes.json()) as KakaoUserResponse;
    if (!kakaoUser.id) {
      return NextResponse.json(
        { error: "카카오 사용자 ID가 없습니다." },
        { status: 401 },
      );
    }

    const uid = `kakao_${kakaoUser.id}`;
    const name =
      kakaoUser.kakao_account?.profile?.nickname?.trim().slice(0, 80) ||
      "카카오 회원";
    const email = kakaoUser.kakao_account?.email?.trim() || "";

    const auth = getFirebaseAdminAuth();
    try {
      await auth.getUser(uid);
    } catch {
      try {
        await auth.createUser({
          uid,
          displayName: name,
          ...(email ? { email, emailVerified: true } : {}),
        });
      } catch {
        // 이메일이 이미 다른 계정에 있으면 이메일 없이 생성
        await auth.createUser({
          uid,
          displayName: name,
        });
      }
    }

    const customToken = await auth.createCustomToken(uid, {
      provider: "kakao",
      kakao_id: String(kakaoUser.id),
    });

    return NextResponse.json({
      customToken,
      profile: {
        name,
        phone: "",
      },
    });
  } catch (error) {
    console.error("[auth/kakao]", error);
    return NextResponse.json(
      { error: "카카오 로그인 처리에 실패했습니다." },
      { status: 500 },
    );
  }
}

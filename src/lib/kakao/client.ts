"use client";

type KakaoAuthSuccess = {
  access_token: string;
};

type KakaoSDK = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Auth: {
    login: (options: {
      scope?: string;
      success: (authObj: KakaoAuthSuccess) => void;
      fail: (error: unknown) => void;
    }) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

function loadKakaoSdk(): Promise<KakaoSDK> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 카카오 로그인을 사용할 수 있습니다."));
  }

  if (window.Kakao) {
    return Promise.resolve(window.Kakao);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Kakao) resolve(window.Kakao);
        else reject(new Error("카카오 SDK 로드에 실패했습니다."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("카카오 SDK 로드에 실패했습니다.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Kakao) resolve(window.Kakao);
      else reject(new Error("카카오 SDK 로드에 실패했습니다."));
    };
    script.onerror = () => reject(new Error("카카오 SDK 로드에 실패했습니다."));
    document.head.appendChild(script);
  });
}

export function isKakaoConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
}

export async function loginWithKakaoSdk(): Promise<string> {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) {
    throw new Error("카카오 JS 키가 설정되지 않았습니다.");
  }

  const Kakao = await loadKakaoSdk();
  if (!Kakao.isInitialized()) {
    Kakao.init(jsKey);
  }

  return new Promise((resolve, reject) => {
    Kakao.Auth.login({
      scope: "profile_nickname,account_email",
      success: (auth) => {
        if (!auth?.access_token) {
          reject(new Error("카카오 액세스 토큰을 받지 못했습니다."));
          return;
        }
        resolve(auth.access_token);
      },
      fail: () => reject(new Error("카카오 로그인이 취소되었거나 실패했습니다.")),
    });
  });
}

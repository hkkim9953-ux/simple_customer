# SimpleReserve

고객 예약 관리 웹사이트 (Next.js App Router + Firebase Auth/Firestore + Tailwind CSS)

## Features

- 회원가입 / 로그인 / 회원탈퇴 (Firebase Auth)
- 예약 생성 / 내 예약 / 관리자 예약 관리 (Firestore)
- 모노톤 UI

## Setup

1. `.env.local.example`을 복사해 `.env.local` 작성
2. Firebase Console에서 Authentication(Email/Password)과 Firestore 활성화
3. `firestore.rules` 배포 (클라이언트 직접 접근 차단, Admin SDK만 사용)
4. 관리자 지정: Firestore `profiles/{uid}` 문서에 `isAdmin: true`

```bash
npm install
npm run dev
```

## Deploy

Vercel에 연결 후 Firebase 환경변수를 Project Settings → Environment Variables에 등록하세요.

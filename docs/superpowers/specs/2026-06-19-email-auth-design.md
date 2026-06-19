# 이메일 회원가입/로그인 추가 설계

작성일: 2026-06-19

## 목표

기존 Google 로그인에 더해, 이메일/비밀번호로도 회원가입·로그인할 수 있게
한다. 회원가입 시 **확인 메일**을 요구한다(가짜 이메일 방지).

## 배경

`src/Login.jsx`는 현재 "Google로 시작하기" 버튼 하나뿐이다. 인증 함수는
`src/supabase.js`에 모여 있고(`signInWithGoogle`/`signOut`/`onAuth`), `index.js`가
세션을 구독해 Login/RoomList/App을 라우팅한다. 이 흐름은 그대로 두고 진입
화면과 인증 함수만 확장한다.

## 설계

### supabase.js — 함수 2개 추가

- `signUpWithEmail(email, password)`
  → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })`.
  반환: `{ data, error }`. 확인 메일이 발송되며, "Confirm email"이 켜진 경우
  이 시점에 세션은 생성되지 않는다.
- `signInWithEmail(email, password)`
  → `supabase.auth.signInWithPassword({ email, password })`.
  반환: `{ data, error }`. 성공 시 세션 생성 → `onAuth`가 감지.

기존 `signInWithGoogle`/`signOut`/`onAuth`는 변경 없음.

### Login.jsx — 진입 화면 개편

상태: `mode`("login" | "signup"), `email`, `password`, `busy`, `error`, `notice`.

구성:
1. 로고/타이틀(기존 유지).
2. **이메일 입력**, **비밀번호 입력**.
3. 제출 버튼 — `mode`에 따라 "로그인" 또는 "회원가입".
   - signup 성공 → 입력 폼을 비우고 `notice`에
     *"확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요."* 표시.
   - login 성공 → 페이지가 세션을 얻어 자동으로 RoomList로 전환(별도 처리 불필요).
4. **로그인 ↔ 회원가입 토글** 링크.
5. **구분선** + **"Google로 계속하기"** 버튼(기존 `signInWithGoogle`).

입력 검증(클라이언트):
- 이메일: 비어 있지 않고 `@` 포함.
- 비밀번호: 최소 6자(Supabase 기본 정책과 일치).
- 미충족 시 `error`로 안내, 제출 차단.

### 에러 처리(메시지 매핑)

`signInWithEmail`/`signUpWithEmail`의 `error.message`를 사용자 문구로 변환:
- 로그인 실패(자격 불일치, "Invalid login credentials") →
  *"이메일 또는 비밀번호를 확인해 주세요."*
- 이메일 미인증("Email not confirmed") →
  *"메일 인증 후 로그인해 주세요."*
- 회원가입 시 이미 가입된 이메일("User already registered") →
  *"이미 가입된 이메일이에요. 로그인해 주세요."*
- 그 외 → *"문제가 생겼어요. 잠시 후 다시 시도해 주세요."*

세부 분기가 어려운 경우 마지막 일반 문구로 폴백한다.

### 인증 흐름(변경 없음)

확인 메일 링크 클릭 → Supabase가 세션 생성 후 `window.location.origin`으로
리디렉트 → 기존 `onAuth`가 세션을 감지 → `index.js`가 RoomList로 라우팅.
`index.js`/`App.jsx` 변경 없음.

## 수동 설정(사용자)

- Supabase 대시보드 → Authentication → Providers → **Email 활성화**,
  **"Confirm email" ON**(신규 프로젝트 기본값). 이미 켜져 있으면 추가 작업 없음.
- Site URL / Redirect URLs에 `http://localhost:3000`·배포 주소 포함(기존에 설정됨).

## 범위 밖 (YAGNI)

- 비밀번호 재설정("비밀번호 찾기") — 이번 범위에서 제외.
- 매직링크(비밀번호 없는 로그인) — 제외.

## 테스트

- **단위테스트**: 입력 검증용 순수 헬퍼 `validateCredentials(email, password)`를
  분리해 테스트(이메일에 `@` 없음 / 비밀번호 6자 미만 / 정상 케이스).
- **수동 검증**: `npm start`로
  (1) 이메일 회원가입 → 확인 메일 안내 표시 →
  (2) 메일 링크 클릭 → 앱이 로그인 상태로 진입 →
  (3) 로그아웃 후 같은 이메일/비밀번호로 로그인 →
  (4) 틀린 비밀번호 → 오류 문구 →
  (5) Google 버튼도 여전히 동작.

## 영향 받는 파일

- 수정: `src/supabase.js`(함수 2개 추가), `src/Login.jsx`(화면 개편).
- 수정/테스트: 검증 헬퍼는 `src/Login.jsx` 또는 작은 모듈로 분리하고
  해당 테스트 파일 추가.
- `index.js`/`App.jsx`/스키마 변경 없음.

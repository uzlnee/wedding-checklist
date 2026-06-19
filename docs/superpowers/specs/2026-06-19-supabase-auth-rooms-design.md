# Supabase 전환 + Google 로그인 / 내 방 목록 설계

작성일: 2026-06-19

## 목표

방 코드를 잊으면 입장할 수 없는 문제를 없앤다. 백엔드를 Firebase에서
**Supabase로 전환**하고, **Google 로그인**을 도입해 방을 계정에 연결한다.
로그인하면 "내 방 목록"에서 코드 없이 바로 입장할 수 있고, 코드는 파트너를
초대하는 수단으로만 남는다. 로그인은 필수다.

## 배경 / 현재 구조

- 방 = Firestore `rooms/{code}` 문서 `{ items, weddingDate, createdAt }`.
- 코드는 6자리 랜덤 문자(문서 ID), `localStorage`에만 저장 → 코드를 잊거나
  다른 기기로 가면 복구 불가.
- 보안 규칙은 완전 개방(`allow read, write: if true`).
- 인증 없음.

## 접근 방식

Firebase → Supabase 백엔드 전환과 로그인 기능을 한 묶음으로 구현한다(기능이
새 백엔드 위에 올라가므로 분리 불가). 단, 작업은 "데이터 계층 교체 → 인증/방
흐름" 순서로 쌓는다.

대안으로 Firebase에 Auth만 추가하는 방안이 더 작업량이 적었으나, 사용자가
Supabase 전환을 선택했다.

## Supabase 백엔드 (수동 세팅 — 완료됨)

다음은 사용자가 대시보드에서 이미 완료했다:
- 프로젝트 생성. Project URL: `https://esexnjuekeopfaentzvf.supabase.co`.
- `supabase/schema.sql` 실행 → `rooms` 테이블 + RLS 정책 + `join_room` 함수
  + Realtime 발행 등록.
- Google 로그인 provider 활성화, redirect/Site URL 설정.

### 데이터 모델 — `rooms` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `code` | text (PK) | 6자리 공유 코드(대문자) |
| `title` | text | 방 이름 |
| `members` | uuid[] | 참여자(auth.users.id) 목록 |
| `items` | jsonb | 체크리스트 항목(47개 seed) |
| `wedding_date` | text | 예식일(YYYY-MM-DD) |
| `created_at` | timestamptz | 생성 시각 |

### 권한 (RLS + RPC) — `supabase/schema.sql`에 구현됨

- **select**: `auth.uid() = any(members)` — 내가 멤버인 방만 조회(내 방 목록).
- **insert**: `auth.uid() = any(members)` — 생성 시 본인 포함 강제.
- **update**: `using/with check: auth.uid() = any(members)` — 멤버만 편집.
- **join_room(room_code)** (`security definer`): 코드로 방을 찾아 호출자
  uid를 members에 추가(중복 방지)하고 방을 반환. 없는 코드면 예외. 아직
  멤버가 아닌 방을 코드로 입장하는 경로를 안전하게 처리한다.

## 클라이언트 설계

### 환경변수

- `.env` (gitignore): `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`.
- `.env.example` (커밋): 키 이름만 담은 템플릿.
- CRA는 빌드 시 `REACT_APP_` 변수를 주입하므로, `.env` 추가 후 dev 서버
  재시작이 필요하다. Vercel에도 동일 환경변수를 등록한다(배포 시).

### `src/supabase.js` (신규 — `src/firebase.js` 대체)

Supabase 클라이언트와 데이터/인증 함수를 한곳에 모은다.

- `supabase` — `createClient(url, anonKey)`.
- 인증
  - `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: 'google' })`.
  - `signOut()` → `supabase.auth.signOut()`.
  - `onAuth(callback)` → `supabase.auth.onAuthStateChange`로 세션 변화 구독,
    현재 user를 callback에 전달. 초기 세션도 즉시 전달.
- 방
  - `listMyRooms()` → `select code,title,wedding_date,items,created_at`(RLS가
    멤버 방으로 한정). 목록 표시에 필요한 필드 반환.
  - `createRoom(title)` → 6자리 코드 생성, 현재 uid를 members로 하여 insert,
    `items`는 `seedItems()`, `wedding_date` 빈 값. 코드 반환.
  - `joinRoom(code)` → `supabase.rpc('join_room', { room_code: code })`. 성공
    시 방(특히 title) 반환, 없는 코드면 에러.
  - `saveRoom(code, { items, weddingDate })` → `update`(멤버만, RLS).
  - `subscribeRoom(code, callback)` → 최초 1회 `select`로 현재 상태 전달 +
    `supabase.channel`로 해당 code의 UPDATE를 구독해 실시간 반영. 해제 함수
    반환.

코드 생성기: 기존 `uid6`와 동일한 6자리 대문자 생성 로직을 supabase.js로
옮긴다.

### 화면 흐름 — `src/index.js`

`Root`가 `onAuth`로 세션을 구독하고 세 상태를 라우팅한다:

1. **로그인 안 됨** → `<Login>` (Google 버튼 1개).
2. **로그인됨, 방 미선택** → `<RoomList>`.
3. **로그인됨, 방 선택** → `<App roomCode=… onLeave=… />`.

"마지막 방"을 `localStorage`에 저장해, 로그인 사용자가 다시 들어오면 곧장 그
방으로(목록 건너뜀). 헤더의 "목록으로"가 이 값을 비우고 `RoomList`로 보낸다.

### `src/Login.jsx` (신규)

로고 + "Google로 시작하기" 버튼. `signInWithGoogle()` 호출. 로딩/에러 표시.

### `src/RoomList.jsx` (신규 — 기존 `RoomGate.jsx` 대체)

- 마운트 시 `listMyRooms()` 호출 → 방 카드 목록(이름, 예식일/진행률 등 간단
  표시). 탭하면 그 방으로 입장.
- "+ 새 방 만들기" → 이름 입력 → `createRoom(title)` → 입장.
- "🔗 코드로 입장" → 코드 입력 → `joinRoom(code)` → 성공 시 입장, 실패 시
  에러. 입장 후 목록에 영구 편입.
- 로그아웃 버튼.

기존 `RoomGate.jsx`는 삭제하고 이 컴포넌트로 대체한다.

### `src/App.jsx` 변경

- import를 `./firebase` → `./supabase`로 교체(`saveRoom`, `subscribeRoom`).
  함수 시그니처는 동일하게 유지하므로 본문 로직 변경 최소.
- 헤더에 "목록으로"(방 전환)와 로그아웃 추가. 기존 코드 공유 UI 유지.
- `onLeave` prop을 실제로 사용(현재 index.js가 넘기지만 App이 미사용).

### 삭제 / 정리

- `src/firebase.js` 삭제, `firestore.rules` 삭제.
- `package.json`: `firebase` 제거, `@supabase/supabase-js` 추가.
- `README.md`: Supabase 기준으로 갱신(로컬 실행 시 `.env` 필요 안내 포함).

## 기존 데이터

기존 Firestore 테스트 방은 **이전하지 않는다**(출시 전 테스트 데이터). 로그인
후 새로 만들거나, 옛 코드로 입장(join)하면 새 백엔드 기준으로 다시 시작한다.

## 에러 처리

- OAuth 팝업/리디렉트 취소·실패 → 로그인 화면에 안내, 재시도 가능.
- `joinRoom` 없는 코드 → "존재하지 않는 방 코드" 표시(기존 문구 유지).
- 네트워크 실패 → 로딩 해제 + 재시도 안내.
- 세션 만료 → `onAuth`가 미로그인으로 전환 → 로그인 화면.

## 테스트

Auth/Realtime/Postgres 연동이 대부분이라 에뮬레이터 없이 단위테스트가 어렵다.
- **단위테스트**: 순수 로직만 — 6자리 코드 생성기(형식·길이), 그리고 가능하면
  방 카드 표시용 순수 헬퍼.
- **수동 검증**: `.env` 설정 후 `npm start`로
  (1) Google 로그인 → (2) 새 방 생성(이름) → 47개 항목 확인 →
  (3) 다른 계정으로 로그인 후 코드로 입장 → 목록 편입 확인 →
  (4) 한쪽 편집이 다른 쪽에 실시간 반영 → (5) 로그아웃/재로그인 시 목록 유지.

## 영향 받는 파일 요약

- 신규: `src/supabase.js`, `src/Login.jsx`, `src/RoomList.jsx`,
  `.env`(gitignore), `.env.example`, `supabase/schema.sql`(작성 완료).
- 수정: `src/index.js`, `src/App.jsx`, `package.json`, `README.md`,
  `.gitignore`.
- 삭제: `src/firebase.js`, `src/RoomGate.jsx`, `firestore.rules`.

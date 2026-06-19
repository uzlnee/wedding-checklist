# 방 나가기 / 삭제 설계

작성일: 2026-06-19

## 목표

내 방 목록에서 방을 **나가기**(내 목록에서만 제거) 또는 **완전 삭제**(모두에게서
영구 삭제)할 수 있게 한다. 방은 파트너와 공유되므로 두 의미를 분리해 제공한다.

## 의미

- **나가기**: 내 `members`에서만 빠진다. 파트너는 계속 방을 쓴다. 데이터 보존.
  내가 마지막 멤버였다면 고아 방이 되므로 방을 자동 삭제한다.
- **삭제**: 방 행을 drop. 나·파트너 모두에게서 사라지고 체크리스트도 영구 삭제.
  되돌릴 수 없다.

## SQL (수동 1회 — `supabase/2026-06-19-room-delete.sql`)

- **delete RLS 정책** `rooms_delete_members`: `using (auth.uid() = any(members))` —
  멤버는 방을 삭제할 수 있다.
- **`leave_room(room_code)`** (`security definer`): 호출자 uid를 `members`에서
  `array_remove`. 일반 update는 정책의 `with check (멤버 유지)`에 막히므로 RPC로
  처리한다. 제거 후 남은 멤버가 없으면 방을 delete한다. 멤버가 아니거나 없는
  방이면 조용히 종료.

## 클라이언트 — supabase.js

- `deleteRoom(code)` → `supabase.from("rooms").delete().eq("code", code)`; `error`면 throw.
- `leaveRoom(code)` → `supabase.rpc("leave_room", { room_code: code.toUpperCase() })`; `error`면 throw.

## UI — RoomList.jsx

기존 방 카드는 통째로 `<button>`(탭=입장)이었다. 카드 안에 또 다른 버튼을 둘 수
없으므로 카드를 `<div>`로 바꾸고:
- 본문 영역(이름·메타) `onClick` → 입장(기존 동작).
- 우측 **"⋯" 버튼**(`stopPropagation`) → 해당 카드의 액션 메뉴 토글(`menuFor` 상태).
- 메뉴 펼침 시:
  - **나가기** → `leaveRoom(code)` → 목록에서 제거.
  - **삭제** → 확인 단계(`confirmDelete` 상태)로 전환 →
    *"완전 삭제할까요? 파트너도 못 쓰게 되고 되돌릴 수 없어요"* + 삭제/취소 →
    `deleteRoom(code)` → 목록에서 제거.
- 동작 중 `busy`로 버튼 비활성화, 실패 시 카드에 에러 문구.

상태 추가: `menuFor`(code|null), `confirmDelete`(code|null), `actionBusy`(bool),
`actionErr`(string). 액션 성공 시 로컬 `rooms`에서 해당 code를 필터링해 제거하고
메뉴를 닫는다(전체 재조회 대신 로컬 갱신).

## 에러 처리

- 네트워크/권한 실패 → 카드에 *"처리에 실패했어요. 다시 시도해 주세요."*, `busy` 해제.
- 삭제는 2단계 확인으로 오조작 방지.

## 테스트

RLS/RPC 연동이라 순수 로직이 없어 단위테스트는 추가하지 않는다. 검증은 빌드 +
수동:
1. ⋯ → 나가기 → 내 목록에서 사라짐, (다른 계정에선) 방 유지.
2. ⋯ → 삭제 → 확인 → 목록에서 사라지고, 파트너 계정에서도 사라짐.
3. 마지막 멤버가 나가기 → 방 자동 삭제(대시보드에서 행 사라짐 확인).

## 영향 받는 파일

- 신규: `supabase/2026-06-19-room-delete.sql`(작성 완료).
- 수정: `src/supabase.js`(함수 2개), `src/RoomList.jsx`(카드 구조 + 메뉴).

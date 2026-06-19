-- ============================================================
-- Wedding Checklist · 방 나가기/삭제 추가 (delta)
-- ------------------------------------------------------------
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체를 붙여넣고 RUN.
-- (schema.sql 이후에 실행하는 추가분. 재실행해도 안전.)
--
-- 추가하는 것:
--   1) delete RLS 정책 — 멤버는 방을 완전 삭제 가능
--   2) leave_room(room_code) — 내 uid를 members에서 제거,
--      마지막 멤버였다면 방을 자동 삭제(고아 방 정리)
-- ============================================================

-- 1) delete 정책: 멤버만 삭제 가능
drop policy if exists "rooms_delete_members" on public.rooms;
create policy "rooms_delete_members"
  on public.rooms
  for delete
  to authenticated
  using ( auth.uid() = any(members) );

-- 2) 방 나가기 함수
-- update의 with check(멤버 유지)에 막히지 않도록 security definer로 처리한다.
create or replace function public.leave_room(room_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  remaining uuid[];
begin
  if uid is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  update public.rooms
     set members = array_remove(members, uid)
   where code = upper(room_code)
     and uid = any(members)
  returning members into remaining;

  -- 멤버가 아니었거나 없는 방이면 조용히 종료
  if not found then
    return;
  end if;

  -- 남은 멤버가 없으면 방 자체를 삭제
  if remaining is null or array_length(remaining, 1) is null then
    delete from public.rooms where code = upper(room_code);
  end if;
end;
$$;

grant execute on function public.leave_room(text) to authenticated;

-- ============================================================
-- Wedding Checklist · Supabase 스키마
-- ------------------------------------------------------------
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체를 붙여넣고 RUN.
-- (여러 번 실행해도 안전하도록 idempotent하게 작성됨)
--
-- 이 스크립트가 만드는 것:
--   1) public.rooms 테이블
--   2) Row Level Security(RLS) 정책 — 멤버만 자기 방을 읽고/쓰기
--   3) join_room(room_code) 함수 — 코드로 방에 본인을 멤버로 추가
--   4) Realtime 발행에 rooms 테이블 등록
-- ============================================================

-- 1) 테이블 ---------------------------------------------------
create table if not exists public.rooms (
  code         text        primary key,            -- 6자리 공유 코드 (대문자)
  title        text        not null default '',    -- 방 이름
  members      uuid[]      not null default '{}',   -- 참여자(auth.users.id) 목록
  items        jsonb       not null default '[]'::jsonb,  -- 체크리스트 항목
  wedding_date text        not null default '',     -- 예식일 (YYYY-MM-DD)
  created_at   timestamptz not null default now()
);

-- 2) RLS ------------------------------------------------------
alter table public.rooms enable row level security;

-- 기존 정책이 있으면 지우고 다시 만든다 (재실행 안전)
drop policy if exists "rooms_select_members"  on public.rooms;
drop policy if exists "rooms_insert_self"     on public.rooms;
drop policy if exists "rooms_update_members"  on public.rooms;

-- 조회: 내가 멤버인 방만 보인다 (= 내 방 목록)
create policy "rooms_select_members"
  on public.rooms
  for select
  to authenticated
  using ( auth.uid() = any(members) );

-- 생성: 새 방을 만들 때 본인을 members에 포함해야 한다
create policy "rooms_insert_self"
  on public.rooms
  for insert
  to authenticated
  with check ( auth.uid() = any(members) );

-- 수정: 멤버만 수정 가능하고, 수정 후에도 본인이 멤버로 남아 있어야 한다
create policy "rooms_update_members"
  on public.rooms
  for update
  to authenticated
  using      ( auth.uid() = any(members) )
  with check ( auth.uid() = any(members) );

-- (삭제 정책 없음 — 클라이언트는 방을 삭제하지 않음)

-- 3) 코드로 입장하는 함수 -------------------------------------
-- 아직 멤버가 아닌 방은 RLS상 읽거나 수정할 수 없으므로,
-- security definer 함수로 안전하게 "코드 확인 + 본인 추가"를 처리한다.
create or replace function public.join_room(room_code text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.rooms;
  uid    uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  update public.rooms
     set members = case
                     when uid = any(members) then members         -- 이미 멤버면 그대로
                     else array_append(members, uid)              -- 아니면 추가
                   end
   where code = upper(room_code)
   returning * into result;

  if not found then
    raise exception '존재하지 않는 방 코드입니다.' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

-- 로그인 사용자가 호출할 수 있도록 권한 부여
grant execute on function public.join_room(text) to authenticated;

-- 4) Realtime 발행에 등록 -------------------------------------
-- (이미 등록돼 있으면 에러가 날 수 있으니, 안전하게 조건부로 추가)
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename  = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

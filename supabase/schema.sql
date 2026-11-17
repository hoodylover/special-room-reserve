-- 특별실 현황 앱 스키마 (Supabase SQL Editor에 그대로 붙여넣어 실행)
-- 여러 번 실행해도 안전하도록 작성했어요.

create extension if not exists btree_gist;

-- 특별실
create table if not exists public.rooms (
  id          bigint generated always as identity primary key, -- 특별실 번호
  name        text not null unique,                              -- 특별실 이름
  created_by  text,                                              -- 만든 사람 표시 (신원 확인 정보 아님)
  created_at  timestamptz not null default now(),                -- 만든 시각
  updated_at  timestamptz not null default now()                 -- 마지막으로 고친 시각
);

-- 예약 및 사용 기록
create table if not exists public.reservations (
  id               bigint generated always as identity primary key,               -- 기록 번호
  room_id          bigint not null references public.rooms(id) on delete cascade, -- 특별실 번호
  use_date         date not null,                                                 -- 사용 날짜
  start_time       time not null,                                                 -- 시작 시각
  end_time         time not null,                                                 -- 종료 시각
  purpose          text not null check (char_length(purpose) between 1 and 100),  -- 사용 목적
  role_label       text not null check (char_length(role_label) between 1 and 40),-- 직책 표시
  status           text not null default 'reserved'
                   check (status in ('reserved', 'in_use', 'done', 'unused')),   -- 예약됨/사용 중/사용 완료/미사용
  actual_start_at  timestamptz,                                                   -- 실제 사용 시작 시각
  actual_end_at    timestamptz,                                                   -- 실제 사용 종료 시각
  created_by       text,                                                          -- 만든 사람 표시
  created_at       timestamptz not null default now(),                            -- 만든 시각
  updated_at       timestamptz not null default now(),                            -- 마지막으로 고친 시각
  constraint reservations_time_order check (start_time < end_time),
  -- 같은 특별실에서 '예약됨'·'사용 중' 예약끼리 시간이 겹치면 저장되지 않음 (동시 저장도 막힘)
  constraint reservations_no_overlap exclude using gist (
    room_id with =,
    tsrange(use_date + start_time, use_date + end_time) with &&
  ) where (status in ('reserved', 'in_use'))
);

create index if not exists reservations_use_date_idx on public.reservations (use_date);

-- 마지막으로 고친 시각 자동 갱신
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists rooms_touch on public.rooms;
create trigger rooms_touch before update on public.rooms
  for each row execute function public.touch_updated_at();

drop trigger if exists reservations_touch on public.reservations;
create trigger reservations_touch before update on public.reservations
  for each row execute function public.touch_updated_at();

-- 접근 권한: PRD에 따라 링크를 가진 누구나 읽기·넣기·고치기·지우기 가능
alter table public.rooms enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "anyone can do anything" on public.rooms;
create policy "anyone can do anything" on public.rooms
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "anyone can do anything" on public.reservations;
create policy "anyone can do anything" on public.reservations
  for all to anon, authenticated using (true) with check (true);

-- 기본 특별실
insert into public.rooms (name, created_by) values
  ('체육관', '초기 설정'),
  ('시청각실', '초기 설정'),
  ('컴퓨터실', '초기 설정'),
  ('과학실', '초기 설정'),
  ('음악실', '초기 설정'),
  ('놀이실', '초기 설정')
on conflict (name) do nothing;

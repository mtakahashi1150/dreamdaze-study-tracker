-- 既存プロジェクト向け：曜日ごとの学習・塾時間設定
-- Supabase SQL Editor で実行してください。

create table if not exists public.weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  study_minutes int not null default 0 check (study_minutes >= 0 and study_minutes <= 1440),
  juku_minutes int not null default 0 check (juku_minutes >= 0 and juku_minutes <= 1440),
  created_at timestamptz not null default now(),
  unique (family_id, day_of_week)
);

alter table public.weekly_schedule enable row level security;

create policy "weekly_schedule_select_family"
  on public.weekly_schedule for select
  using (family_id = public.current_family_id());

create policy "weekly_schedule_insert_family"
  on public.weekly_schedule for insert
  to authenticated
  with check (family_id = public.current_family_id());

create policy "weekly_schedule_update_family"
  on public.weekly_schedule for update
  using (family_id = public.current_family_id());

create policy "weekly_schedule_delete_family"
  on public.weekly_schedule for delete
  using (family_id = public.current_family_id());

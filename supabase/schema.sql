-- DREAMDAZE 学習トラッカー — Supabase スキーマ
-- SQL Editor に貼り付けて実行してください。

create extension if not exists "pgcrypto";

-- 家族単位
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now()
);

-- auth.users と 1:1
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  role text not null check (role in ('child', 'parent')),
  display_name text not null,
  created_at timestamptz not null default now()
);

-- 学習セッション（チェックイン〜チェックアウト）
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  transcript_start text,
  transcript_end text,
  kind text not null default 'study' check (kind in ('study', 'juku')),
  manual_edited boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ended_after_start check (ended_at is null or ended_at >= started_at)
);

-- 土日 9h/4h の週割り当て（未設定時はアプリ側デフォルト 土4・日9）
create table if not exists public.week_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  week_start date not null,
  sat_hours int not null check (sat_hours in (4, 9)),
  sun_hours int not null check (sun_hours in (4, 9)),
  created_at timestamptz not null default now(),
  unique (family_id, week_start)
);

create index if not exists idx_sessions_member_started on public.study_sessions (member_id, started_at desc);
create index if not exists idx_sessions_family_started on public.study_sessions (family_id, started_at desc);

-- RLS
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.week_plans enable row level security;

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- families: 自分の家族のみ読み取り。作成は認証済みユーザー（初回登録用）
create policy "families_select_own"
  on public.families for select
  using (id = public.current_family_id());

create policy "families_insert_authenticated"
  on public.families for insert
  to authenticated
  with check (true);

create policy "families_select_by_invite"
  on public.families for select
  to authenticated
  using (true);

-- profiles
create policy "profiles_select_family"
  on public.profiles for select
  using (family_id = public.current_family_id());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- study_sessions: 家族全員が読み取り。作成・更新は child のみ（自分のセッション）
create policy "sessions_select_family"
  on public.study_sessions for select
  using (family_id = public.current_family_id());

create policy "sessions_insert_child"
  on public.study_sessions for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and family_id = public.current_family_id()
    and public.current_role() = 'child'
  );

create policy "sessions_update_child_own"
  on public.study_sessions for update
  using (
    member_id = auth.uid()
    and public.current_role() = 'child'
  );

create policy "sessions_delete_child_own"
  on public.study_sessions for delete
  using (
    member_id = auth.uid()
    and public.current_role() = 'child'
  );

-- week_plans
create policy "week_plans_select_family"
  on public.week_plans for select
  using (family_id = public.current_family_id());

create policy "week_plans_upsert_child"
  on public.week_plans for insert
  to authenticated
  with check (
    family_id = public.current_family_id()
    and public.current_role() = 'child'
  );

create policy "week_plans_update_child"
  on public.week_plans for update
  using (
    family_id = public.current_family_id()
    and public.current_role() = 'child'
  );

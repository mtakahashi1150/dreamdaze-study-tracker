-- 自習を「自宅」「N高」に分割、weekly_schedule に列追加
-- Supabase SQL Editor で実行してください。

-- 1) セッション種別
alter table public.study_sessions drop constraint if exists study_sessions_kind_check;
update public.study_sessions set kind = 'study_home' where kind = 'study';
alter table public.study_sessions
  add constraint study_sessions_kind_check
  check (kind in ('juku', 'study_home', 'study_n'));

-- 2) 曜日目標
alter table public.weekly_schedule
  add column if not exists study_home_minutes int not null default 0
    check (study_home_minutes >= 0 and study_home_minutes <= 1440);
alter table public.weekly_schedule
  add column if not exists study_n_minutes int not null default 0
    check (study_n_minutes >= 0 and study_n_minutes <= 1440);

update public.weekly_schedule
set study_home_minutes = study_minutes
where study_home_minutes = 0 and study_minutes > 0;

-- 親が設定するお子さんの表示名（参加前の表示用）
alter table public.families
  add column if not exists expected_child_name text;

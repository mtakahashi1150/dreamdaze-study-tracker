-- 全データリセット（学習記録・家族・プロフィール・ログインユーザー）
-- Supabase SQL Editor で Run してください。
-- 実行後、全員が最初から /onboarding で再登録します。

-- 1) アプリデータ
delete from public.study_sessions;
delete from public.weekly_schedule;
delete from public.week_plans;
delete from public.profiles;
delete from public.families;

-- 2) 認証ユーザー（Google / メールログインのアカウント）
delete from auth.users;

-- 確認（すべて 0 なら OK）
select
  (select count(*) from public.families) as families,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.study_sessions) as sessions,
  (select count(*) from auth.users) as auth_users;

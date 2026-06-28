# 家族アカウントの初期設定（リセット後）

テストデータでロール（親/子）が逆になっている場合は、**一度すべて消して** やり直すのが確実です。

---

## ① データをリセット（Supabase SQL Editor）

[`supabase/scripts/reset_all_data.sql`](../supabase/scripts/reset_all_data.sql) をコピーして **Run**。

最後の確認行がすべて **0** なら成功です。

> 003 の `expected_child_name` 列は消えません（空の families だけ）。

---

## ② Google テストユーザー（Google Cloud Console）

**Google Auth Platform → 対象 → テストユーザー** に次を追加：

| 役割 | Gmail |
|------|-------|
| 親（1人目） | masamichi.takahashi@gmail.com |
| 親（2人目・妻） | mm.akitakahashi@gmail.com |
| 子 | hiroto.takahashi3156@gmail.com |

---

## ③ 登録の順番

### 1. あなた（最初の親）

1. https://project-18ha2.vercel.app/onboarding
2. **Googleで始める** → masamichi.takahashi@gmail.com
3. **親：新しい家族を作る**
4. 表示名: 正道（任意） / 家族名 / お子さんの名前: 寛翔（任意）
5. ホーム画面の **「家族の招待」** にコードが表示される

### 2. 妻（2人目の親）

1. https://project-18ha2.vercel.app/onboarding?step=join_parent
2. Google → mm.akitakahashi@gmail.com
3. **親：招待コードで参加** → コード入力

### 3. 息子（子）

1. https://project-18ha2.vercel.app/onboarding?step=join_child
2. Google → hiroto.takahashi3156@gmail.com
3. **子：招待コードで参加** → 同じコード入力

---

## うまくいかないとき

| 症状 | 対処 |
|------|------|
| また「学習者」画面になる | ① の SQL を Run し、**ログアウト → 再ログイン → onboarding から** |
| Google でブロック | テストユーザーに Gmail を追加 |
| 招待コードが無効 | 親が「家族を作成」まで完了しているか確認 |

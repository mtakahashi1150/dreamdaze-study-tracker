# Google ログインの設定

Google ログインを使うには、**Google Cloud Console** と **Supabase** の両方で設定が必要です（初回のみ、15〜30分程度）。

---

## ① Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクトを作成（または既存を選択）
3. **APIs & Services** → **OAuth consent screen**
   - User Type: **External**（個人利用なら External で可）
   - アプリ名・メールアドレスを入力して保存
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs** に次を追加:

```
https://zuizawnlpvmziwydjtpr.supabase.co/auth/v1/callback
```

（Supabase の Project URL が異なる場合は、`<Project URL>/auth/v1/callback` に置き換え）

5. 表示された **Client ID** と **Client Secret** をコピー

---

## ② Supabase

1. **Authentication** → **Providers** → **Google**
2. **Enable** を ON
3. Client ID / Client Secret を貼り付け → **Save**
4. **Authentication** → **URL Configuration** に以下が入っているか確認:

| 項目 | 値の例 |
|------|--------|
| Site URL | `https://project-18ha2.vercel.app` |
| Redirect URLs | `https://project-18ha2.vercel.app/**` |

---

## ③ 登録の流れ（新）

```
1. 親（あなた）: /onboarding → Google →「親：新しい家族を作る」
2. ホーム画面に招待コードが表示される
3. 妻: /onboarding → Google →「親：招待コードで参加」
4. 子: /onboarding → Google →「子：招待コードで参加」
```

---

## ④ DB マイグレーション（未実行の場合）

Supabase SQL Editor で `supabase/migrations/003_expected_child_name.sql` を Run。

---

## うまくいかないとき

| 症状 | 確認 |
|------|------|
| Google ボタンを押してエラー | Supabase の Google Provider が有効か |
| redirect_uri_mismatch | Google Console の redirect URI が Supabase の callback URL と一致しているか |
| ログイン後にまた onboarding | profiles が作成されているか（家族作成まで完了したか） |

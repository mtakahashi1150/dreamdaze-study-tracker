# Supabase セットアップ（最初から・Vercel デプロイ込み）

登録ボタンを押しても何も起きない／エラーが出ない場合、**ほぼ確実に Supabase の接続設定が Vercel に入っていません**。  
以下を **上から順に** 一度だけ実施してください。

---

## 全体の流れ

```
① Supabase でプロジェクト作成
② SQL でテーブル作成
③ 認証（メール）の設定
④ Vercel に環境変数を入れる → 再デプロイ
⑤ 寛翔（子）→ 親 の順で登録
```

---

## ① Supabase プロジェクトを作る

1. ブラウザで [https://supabase.com](https://supabase.com) を開く（GitHub アカウントでログイン可）
2. **New project**
3. 任意の **Organization** を選ぶ
4. 設定例：
   - **Name**: `dreamdaze-tracker`（何でも可）
   - **Database Password**: 自分用にメモ（このアプリでは直接使わないが必須）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
5. **Create new project** → 1〜2 分待つ

---

## ② データベース（テーブル）を作る

1. Supabase 左メニュー **SQL Editor**
2. **New query**
3. このリポジトリの [`supabase/schema.sql`](../supabase/schema.sql) を **すべてコピー** して貼り付け
4. **Run**（成功と表示されれば OK）

※ 2 回目以降 Run しても `if not exists` なので問題ありません。

---

## ③ 認証の設定（重要）

### 3-1. メール確認を OFF にする

このアプリは「登録したらすぐ使う」想定です。

1. 左メニュー **Authentication** → **Providers** → **Email**
2. **Confirm email** を **OFF**（無効）
3. **Save**

### 3-2. サイト URL（Vercel の URL を登録）

1. **Authentication** → **URL Configuration**
2. **Site URL** に Vercel の URL を入れる  
   例: `https://dreamdaze-study-tracker.vercel.app`  
   （実際にブラウザで開いている URL をそのまま）
3. **Redirect URLs** に次を **追加**（1 行ずつ）:

```
https://あなたのアプリ.vercel.app/**
http://localhost:3000/**
```

4. **Save**

---

## ④ API キーを控える

1. 左メニュー **Project Settings**（歯車）→ **API**
2. 次の 2 つをコピー（メモ帳に一時保存）:

| 名前 | どこにあるか |
|---|---|
| `Project URL` | Project URL |
| `anon` `public` | Project API keys の **anon public** |

**service_role key は Vercel に入れないでください**（秘密鍵です）。

---

## ⑤ Vercel に環境変数を入れる

1. [https://vercel.com](https://vercel.com) → 対象プロジェクトを開く
2. **Settings** → **Environment Variables**
3. 次を **2 つ** 追加:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ④ の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ④ の anon public key |

4. **Environment** は **Production / Preview / Development すべて** にチェック
5. **Save**

### 必ず再デプロイする

環境変数を入れただけでは **既存のデプロイには反映されません**。

1. **Deployments** タブ
2. 最新のデプロイの **⋯** → **Redeploy**
3. 完了まで待つ（1〜3 分）

---

## ⑥ 動作確認

1. Vercel の URL を **シークレットウィンドウ** で開く（キャッシュ回避）
2. トップが `/setup` ではなく `/login` または `/register` に行けば Supabase 接続 OK
3. **新規登録**（子・寛翔）:
   - 表示名: 寛翔
   - 家族名: 任意
   - メール・パスワード（8 文字以上）
   - **登録する** → 緑色で **親用招待コード** が表示される
4. **新規登録**（親・正道）:
   - 親タブ → 招待コード入力 → 登録
5. ログイン後 **/home** で「学習を開始する」が出れば成功

---

## うまくいかないとき

| 症状 | 確認すること |
|---|---|
| 登録ボタンを押しても無反応 | Vercel の環境変数 2 つ + **Redeploy** したか |
| `/setup` のまま | 同上。変数名の typo（`NEXT_PUBLIC_` 必須） |
| 「Invalid API key」 | anon key をコピミスしていないか |
| 登録後「家族の作成に失敗」 | ② schema.sql を Run したか |
| 登録後「招待コードが見つからない」 | 子の登録が完了しているか、コードの大文字小文字 |
| メールが来ない／ログインできない | ③ Confirm email を OFF にしたか |

ブラウザの **開発者ツール → Console** に赤いエラーが出ていれば、その文言を控えてください。

---

## ローカルで試す場合（任意）

```bash
cd programs/dreamdaze-study-tracker
cp .env.example .env.local
# .env.local に URL と anon key を記入
npm install
npm run dev
```

http://localhost:3000 で同じ手順で登録できます。

# DREAMDAZE 学習トラッカー

寛翔さんが **チェックイン／チェックアウト＋音声報告** で学習時間を記録し、親が **カレンダー** で達成状況を確認する PWA（スマホ Web アプリ）です。

## 機能

- **開始**：ボタン → 音声で「いまから何をする？」→ 開始時刻を記録
- **終了**：ボタン → 音声で「何をやった？」→ 終了時刻を記録
- **手入力**：日時を手動編集して後から記録
- **達成判定**：火木 2h / 月水金 塾（音声に「塾」）/ 土日 4h+9h
- **カレンダー**：日ごとの達成を色分け表示
- **親子アカウント**：子が記録、親は閲覧のみ（Supabase RLS）

## セットアップ

### 1. Supabase

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. **SQL Editor** で [`supabase/schema.sql`](./supabase/schema.sql) を実行
3. **Authentication → Providers → Email** で Email 認証を有効化
4. 開発中は **Confirm email** を OFF にすると登録がすぐ使えます
5. **Settings → API** から `Project URL` と `anon public` key をコピー

### 2. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 を iPhone Safari で開き、**共有 → ホーム画面に追加** すると PWA として使えます。

### 4. アカウント作成

1. **寛翔（子）** で `/register` → 「子」タブ → 登録  
   → 表示される **招待コード** をメモ
2. **正道（親）** で `/register` → 「親」タブ → 招待コード入力 → 登録

### 5. Vercel デプロイ

1. GitHub に push
2. Vercel で Import
3. Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
4. Deploy

## 音声入力について

- **Web Speech API**（iOS Safari 標準）を使用
- 塾の報告は「塾に行ってきた」など **「塾」** を含めると自動判定
- うまく動かない場合はテキスト欄に手入力可能

## プロジェクト構成

```
src/app/(app)/home      … 今日の進捗・開始/終了
src/app/(app)/calendar  … 月カレンダー
src/app/(app)/manual    … 手入力
src/lib/rules.ts        … 達成判定ロジック
supabase/schema.sql     … DB スキーマ
```

## 関連ドキュメント

親子合意の条件文書はワークスペース直下の [`合意文書/`](../../合意文書/) を参照。  
LINE 送付の正本は `合意文書/DREAMDAZE_LINE送信文コピペ用.txt`。

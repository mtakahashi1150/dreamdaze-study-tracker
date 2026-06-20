import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">セットアップが必要です</h1>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        Vercel にデプロイ済みでも、Supabase の接続情報が入っていないと登録・ログインは動きません。
      </p>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-700">
        <h2 className="font-semibold">① Supabase</h2>
        <ol className="list-decimal space-y-2 pl-5 text-zinc-700 dark:text-zinc-200">
          <li>
            <a
              href="https://supabase.com"
              className="text-violet-600 underline"
              target="_blank"
              rel="noreferrer"
            >
              supabase.com
            </a>
            でプロジェクト作成（Region: Tokyo 推奨）
          </li>
          <li>
            SQL Editor で{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">supabase/schema.sql</code>{" "}
            を実行
          </li>
          <li>
            Authentication → Email → <strong>Confirm email を OFF</strong>
          </li>
          <li>
            Authentication → URL Configuration → Site URL に Vercel の URL、Redirect URLs に{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">
              https://あなたのアプリ.vercel.app/**
            </code>
          </li>
          <li>Settings → API から Project URL と anon public key をコピー</li>
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-800 dark:bg-violet-950">
        <h2 className="font-semibold text-violet-900 dark:text-violet-100">
          ② Vercel（ここを忘れがち）
        </h2>
        <p className="text-violet-900 dark:text-violet-100">
          Settings → Environment Variables に次を追加:
        </p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-xs text-violet-800 dark:text-violet-200">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="font-medium text-violet-900 dark:text-violet-100">
          追加後、Deployments → Redeploy が必須です。
        </p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">③ 登録の順番</h2>
        <p className="text-zinc-600 dark:text-zinc-300">
          先に子（寛翔）で新規登録 → 表示された招待コードを親が使って登録
        </p>
      </section>

      <Link
        href="/register"
        className="rounded-xl bg-violet-600 py-3 text-center font-semibold text-white"
      >
        設定済みなら新規登録へ
      </Link>
    </main>
  );
}

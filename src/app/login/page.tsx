"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(
        "Supabase が未設定です。Vercel の Environment Variables を設定して Redeploy してください。",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "通信エラー");
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="mt-1 text-sm text-zinc-500">学習トラッカー</p>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase が接続されていません</p>
          <Link href="/setup" className="mt-2 inline-block text-violet-700 underline">
            セットアップ手順を見る
          </Link>
        </div>
      )}

      <GoogleSignInButton label="Googleでログイン" next="/" />

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <p className="relative mx-auto w-fit bg-zinc-50 px-3 text-xs text-zinc-400 dark:bg-zinc-950">
          またはメール
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">メール</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">パスワード</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "ログイン中…" : "メールでログイン"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        はじめての方は{" "}
        <Link href="/onboarding" className="text-violet-600 underline">
          アカウント設定
        </Link>
      </p>
    </main>
  );
}

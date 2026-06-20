"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "child" | "parent";

export default function RegisterPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [mode, setMode] = useState<Mode>("child");
  const [displayName, setDisplayName] = useState("");
  const [familyName, setFamilyName] = useState("寛翔家");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(
        "Supabase が未設定です。Vercel の Environment Variables に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を入れて再デプロイしてください。",
      );
      return;
    }
    setLoading(true);
    setError(null);
    setInviteResult(null);

    try {
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

    if (signUpErr || !authData.user) {
      setLoading(false);
      setError(signUpErr?.message ?? "登録に失敗しました");
      return;
    }

    const userId = authData.user.id;

    if (mode === "child") {
      const { data: family, error: famErr } = await supabase
        .from("families")
        .insert({ name: familyName })
        .select()
        .single();

      if (famErr || !family) {
        setLoading(false);
        setError(famErr?.message ?? "家族の作成に失敗しました");
        return;
      }

      const { error: profErr } = await supabase.from("profiles").insert({
        id: userId,
        family_id: family.id,
        role: "child",
        display_name: displayName,
      });

      if (profErr) {
        setLoading(false);
        setError(profErr.message);
        return;
      }

      setInviteResult(`親用招待コード: ${family.invite_code}`);
      setLoading(false);
      setTimeout(() => {
        router.push("/home");
        router.refresh();
      }, 2500);
      return;
    }

    const { data: family, error: findErr } = await supabase
      .from("families")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (findErr || !family) {
      setLoading(false);
      setError("招待コードが見つかりません");
      return;
    }

    const { error: profErr } = await supabase.from("profiles").insert({
      id: userId,
      family_id: family.id,
      role: "parent",
      display_name: displayName,
    });

    setLoading(false);
    if (profErr) {
      setError(profErr.message);
      return;
    }

    router.push("/home");
    router.refresh();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg === "Failed to fetch"
          ? "Supabase に接続できません。Vercel の Environment Variables に本物の NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を入れて Redeploy してください（placeholder のままでは動きません）。"
          : msg || "通信エラー。Supabase の設定と Vercel の再デプロイを確認してください。",
      );
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">新規登録</h1>
        <p className="mt-1 text-sm text-zinc-500">寛翔（子）または親のアカウントを作成</p>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase が接続されていません</p>
          <p className="mt-2">
            Vercel の Settings → Environment Variables に
            <code className="mx-1 rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>
            と
            <code className="mx-1 rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            を設定し、Deployments から <strong>Redeploy</strong> してください。
          </p>
          <Link href="/setup" className="mt-2 inline-block text-violet-700 underline">
            セットアップ手順
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("child")}
          className={`rounded-xl py-2 text-sm font-medium ${
            mode === "child"
              ? "bg-violet-600 text-white"
              : "border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          子（寛翔）
        </button>
        <button
          type="button"
          onClick={() => setMode("parent")}
          className={`rounded-xl py-2 text-sm font-medium ${
            mode === "parent"
              ? "bg-violet-600 text-white"
              : "border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          親
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">表示名</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={mode === "child" ? "寛翔" : "正道"}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>

        {mode === "child" ? (
          <label className="block">
            <span className="text-sm font-medium">家族名</span>
            <input
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium">招待コード（子が登録時に表示）</span>
            <input
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 uppercase dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
        )}

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
          <span className="text-sm font-medium">パスワード（8文字以上）</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {inviteResult && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
            {inviteResult}
            <br />
            親にこのコードを伝えてください。ホームへ移動します…
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "登録中…" : "登録する"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        すでにアカウントがある方は{" "}
        <Link href="/login" className="text-violet-600 underline">
          ログイン
        </Link>
      </p>
    </main>
  );
}

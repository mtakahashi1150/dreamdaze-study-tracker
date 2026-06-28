"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Step = "auth" | "choose" | "create_parent" | "join_parent" | "join_child";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [familyName, setFamilyName] = useState("寛翔家");
  const [childName, setChildName] = useState("寛翔");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void (async () => {
      if (!supabase) {
        setChecking(false);
        return;
      }
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        setChecking(false);
        setStep("auth");
        return;
      }
      setUser(u);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", u.id)
        .maybeSingle();

      if (profile) {
        router.replace("/home");
        return;
      }

      const preset = searchParams.get("step");
      if (preset === "create") setStep("create_parent");
      else if (preset === "join_parent") setStep("join_parent");
      else if (preset === "join_child") setStep("join_child");
      else setStep("choose");

      setChecking(false);
    })();
  }, [supabase, router, searchParams]);

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err || !data.user) {
      setError(err?.message ?? "登録に失敗しました");
      return;
    }
    setUser(data.user);
    setStep("choose");
  }

  async function completeParentProfile(familyId: string) {
    if (!supabase || !user) return;
    const { error: profErr } = await supabase.from("profiles").insert({
      id: user.id,
      family_id: familyId,
      role: "parent",
      display_name: displayName.trim(),
    });

    setLoading(false);
    if (profErr) {
      setError(profErr.message);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setLoading(true);
    setError(null);

    const { data: family, error: famErr } = await supabase
      .from("families")
      .insert({
        name: familyName,
        expected_child_name: childName.trim() || null,
      })
      .select()
      .single();

    if (famErr?.message?.includes("expected_child_name")) {
      const { data: familyFallback, error: fallbackErr } = await supabase
        .from("families")
        .insert({ name: familyName })
        .select()
        .single();
      if (fallbackErr || !familyFallback) {
        setLoading(false);
        setError(fallbackErr?.message ?? "家族の作成に失敗しました");
        return;
      }
      await completeParentProfile(familyFallback.id);
      return;
    }

    if (famErr || !family) {
      setLoading(false);
      setError(famErr?.message ?? "家族の作成に失敗しました");
      return;
    }

    await completeParentProfile(family.id);
  }

  async function handleJoinParent(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setLoading(true);
    setError(null);

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
      id: user.id,
      family_id: family.id,
      role: "parent",
      display_name: displayName.trim(),
    });

    setLoading(false);
    if (profErr) {
      setError(profErr.message);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function handleJoinChild(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setLoading(true);
    setError(null);

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
      id: user.id,
      family_id: family.id,
      role: "child",
      display_name: displayName.trim(),
    });

    setLoading(false);
    if (profErr) {
      setError(profErr.message);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-full items-center justify-center p-6">
        <p className="text-zinc-500">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">アカウント設定</h1>
        <p className="mt-1 text-sm text-zinc-500">
          親が先に家族を作り、お子さんと別の親を招待します
        </p>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase が未設定です。
          <Link href="/setup" className="ml-1 text-violet-700 underline">
            セットアップ手順
          </Link>
        </div>
      )}

      {step === "auth" && (
        <section className="space-y-4">
          <GoogleSignInButton
            label="Googleで始める"
            next={`/onboarding${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          />

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <p className="relative mx-auto w-fit bg-zinc-50 px-3 text-xs text-zinc-400 dark:bg-zinc-950">
              またはメールで登録
            </p>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-3">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "登録中…" : "メールで登録して次へ"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            すでにアカウントがある方は{" "}
            <Link href="/login" className="text-violet-600 underline">
              ログイン
            </Link>
          </p>
        </section>
      )}

      {step === "choose" && user && (
        <section className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            ログイン中: {user.email}
          </p>
          <button
            type="button"
            onClick={() => setStep("create_parent")}
            className="w-full rounded-2xl border-2 border-violet-300 bg-violet-50 p-4 text-left dark:border-violet-700 dark:bg-violet-950/30"
          >
            <p className="font-bold text-violet-800 dark:text-violet-200">
              親：新しい家族を作る
            </p>
            <p className="mt-1 text-xs text-violet-700 dark:text-violet-300">
              最初の1人（あなた）が家族を作成します
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStep("join_parent")}
            className="w-full rounded-2xl border border-zinc-200 p-4 text-left dark:border-zinc-700"
          >
            <p className="font-bold">親：招待コードで参加</p>
            <p className="mt-1 text-xs text-zinc-500">
              2人目以降の親（奥さんなど）用
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStep("join_child")}
            className="w-full rounded-2xl border border-zinc-200 p-4 text-left dark:border-zinc-700"
          >
            <p className="font-bold">子：招待コードで参加</p>
            <p className="mt-1 text-xs text-zinc-500">お子さんのアカウント用</p>
          </button>
        </section>
      )}

      {step === "create_parent" && user && (
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="text-sm text-zinc-500"
          >
            ← 戻る
          </button>
          <label className="block">
            <span className="text-sm font-medium">あなたの表示名（親）</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="正道"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">家族名</span>
            <input
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">お子さんの名前（表示用）</span>
            <input
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="寛翔"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">
              お子さん本人がログインして参加するまでの表示名です
            </p>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "作成中…" : "家族を作成する"}
          </button>
        </form>
      )}

      {step === "join_parent" && user && (
        <form onSubmit={handleJoinParent} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="text-sm text-zinc-500"
          >
            ← 戻る
          </button>
          <label className="block">
            <span className="text-sm font-medium">あなたの表示名（親）</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">招待コード</span>
            <input
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 uppercase dark:border-zinc-600 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">
              家族を作った親から伝えてもらったコード
            </p>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "参加中…" : "親として参加する"}
          </button>
        </form>
      )}

      {step === "join_child" && user && (
        <form onSubmit={handleJoinChild} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="text-sm text-zinc-500"
          >
            ← 戻る
          </button>
          <label className="block">
            <span className="text-sm font-medium">表示名</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="寛翔"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">招待コード</span>
            <input
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 uppercase dark:border-zinc-600 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">親から伝えてもらったコード</p>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "参加中…" : "子として参加する"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full items-center justify-center p-6">
          <p className="text-zinc-500">読み込み中…</p>
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

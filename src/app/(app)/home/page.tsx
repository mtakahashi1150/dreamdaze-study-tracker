"use client";

import { useRouter } from "next/navigation";
import { SessionPanel } from "@/components/SessionPanel";
import { TodayProgress } from "@/components/TodayProgress";
import { WeekPlanPicker } from "@/components/WeekPlanPicker";
import { useFamilyData } from "@/hooks/useFamilyData";
import { evaluateDay, formatDateJa } from "@/lib/rules";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const { profile, childProfile, sessions, weekPlans, loading, refresh, isChild } =
    useFamilyData();
  const today = new Date();
  const evaluation = evaluateDay(today, sessions, weekPlans);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-zinc-500">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="space-y-5 p-4 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">{formatDateJa(today)}</p>
          <h1 className="text-xl font-bold">
            {isChild ? "今日も頑張ろう" : `${childProfile?.display_name ?? "寛翔"}さんの記録`}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-xs text-zinc-400 underline"
        >
          ログアウト
        </button>
      </header>

      <TodayProgress evaluation={evaluation} isChild={isChild} />

      {isChild && profile && (
        <>
          <SessionPanel
            profileId={profile.id}
            familyId={profile.family_id}
            onUpdated={refresh}
          />
          <WeekPlanPicker
            familyId={profile.family_id}
            onUpdated={refresh}
          />
        </>
      )}

      {!isChild && (
        <section className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-600">
          親モード：寛翔さんの記録を閲覧しています。記録の追加・編集は寛翔さんのアカウントから行います。
        </section>
      )}
    </main>
  );
}

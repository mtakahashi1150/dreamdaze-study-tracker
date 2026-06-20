"use client";

import { useRouter } from "next/navigation";
import { SessionPanel } from "@/components/SessionPanel";
import { TodayProgress } from "@/components/TodayProgress";
import { WeeklyScheduleEditor } from "@/components/WeeklyScheduleEditor";
import { useFamilyData } from "@/hooks/useFamilyData";
import { evaluateDay, formatDateJa, sessionsForDay } from "@/lib/rules";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const {
    profile,
    childProfile,
    sessions,
    weeklySchedule,
    loading,
    refresh,
    isChild,
  } = useFamilyData();
  const today = new Date();
  const evaluation = evaluateDay(today, sessions, weeklySchedule);
  const todaySessions = sessionsForDay(sessions, today);
  const childName = childProfile?.display_name ?? "お子さん";

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
            {isChild ? "今日の学習" : `${childName}さんの記録`}
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

      <TodayProgress
        evaluation={evaluation}
        isChild={isChild}
        todaySessions={todaySessions}
      />

      {isChild && profile && (
        <SessionPanel
          profileId={profile.id}
          familyId={profile.family_id}
          onUpdated={refresh}
        />
      )}

      {profile && (
        <WeeklyScheduleEditor
          familyId={profile.family_id}
          schedule={weeklySchedule}
          onUpdated={refresh}
        />
      )}

      {!isChild && (
        <section className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-600">
          親モード：記録の閲覧と、曜日ごとの目標時間の設定ができます。学習の開始・終了はお子さんのアカウントから行います。
        </section>
      )}
    </main>
  );
}

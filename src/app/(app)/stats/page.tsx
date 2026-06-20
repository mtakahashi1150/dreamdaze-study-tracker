"use client";

import { useMemo } from "react";
import { StatsPanel } from "@/components/StatsPanel";
import { useFamilyData } from "@/hooks/useFamilyData";
import { buildStatsSummary } from "@/lib/rules";

export default function StatsPage() {
  const { sessions, loading, childProfile, isChild } = useFamilyData();
  const childName = childProfile?.display_name ?? "お子さん";

  const summary = useMemo(() => buildStatsSummary(sessions), [sessions]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-zinc-500">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="space-y-5 p-4 pt-6 pb-8">
      <header>
        <h1 className="text-xl font-bold">集計</h1>
        <p className="text-sm text-zinc-500">
          {isChild ? "自分の学習時間" : `${childName}さんの学習時間`}
        </p>
      </header>

      <StatsPanel {...summary} />
    </main>
  );
}

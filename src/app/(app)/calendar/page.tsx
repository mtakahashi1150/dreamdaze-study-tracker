"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { DaySessionList, MonthCalendar } from "@/components/MonthCalendar";
import { useFamilyData } from "@/hooks/useFamilyData";

export default function CalendarPage() {
  const { sessions, weeklySchedule, loading, childProfile, isChild, refresh } =
    useFamilyData();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const childName = childProfile?.display_name ?? "お子さん";

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <p className="text-zinc-500">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="space-y-5 p-4 pt-6">
      <header>
        <h1 className="text-xl font-bold">カレンダー</h1>
        <p className="text-sm text-zinc-500">
          {isChild ? "自分の達成状況" : `${childName}さんの達成状況`}
        </p>
      </header>

      <MonthCalendar
        sessions={sessions}
        weeklySchedule={weeklySchedule}
        onDayClick={setSelectedDay}
      />

      {selectedDay && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-1 font-bold">
            {format(parseISO(selectedDay), "M月d日（EEE）", { locale: ja })}
          </h2>
          {isChild && (
            <p className="mb-3 text-xs text-zinc-500">
              細切れの記録は、各行の「編集」から開始・終了時刻を直せます。
            </p>
          )}
          {!isChild && (
            <p className="mb-3 text-xs text-zinc-500">
              「手入力」印が付いている行は、手で追加・修正された記録です。
            </p>
          )}
          <DaySessionList
            dateKey={selectedDay}
            sessions={sessions}
            isChild={isChild}
            onUpdated={refresh}
          />
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="mt-4 w-full py-2 text-sm text-zinc-500"
          >
            閉じる
          </button>
        </section>
      )}
    </main>
  );
}

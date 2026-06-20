"use client";

import { createClient } from "@/lib/supabase/client";
import { getSaturdayWeekStart } from "@/lib/rules";

type Props = {
  familyId: string;
  disabled?: boolean;
  onUpdated: () => void;
};

export function WeekPlanPicker({ familyId, disabled, onUpdated }: Props) {
  const supabase = createClient();
  const weekStart = getSaturdayWeekStart(new Date());

  async function setPlan(sat: 4 | 9, sun: 4 | 9) {
    const { error } = await supabase.from("week_plans").upsert(
      {
        family_id: familyId,
        week_start: weekStart,
        sat_hours: sat,
        sun_hours: sun,
      },
      { onConflict: "family_id,week_start" },
    );
    if (!error) onUpdated();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-bold">今週の土日（9h / 4h）</h3>
      <p className="mb-3 text-xs text-zinc-500">
        どちらの曜日を9時間／4時間にするか、事前に決めておく
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void setPlan(4, 9)}
          className="rounded-xl border border-zinc-200 py-3 text-sm font-medium hover:border-violet-400 disabled:opacity-40 dark:border-zinc-600"
        >
          土 4h / 日 9h
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void setPlan(9, 4)}
          className="rounded-xl border border-zinc-200 py-3 text-sm font-medium hover:border-violet-400 disabled:opacity-40 dark:border-zinc-600"
        >
          土 9h / 日 4h
        </button>
      </div>
    </section>
  );
}

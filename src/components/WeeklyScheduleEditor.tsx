"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DAY_LABELS,
  DAY_ORDER,
  dayTargetTotal,
  emptyWeekInputs,
  formatMinutes,
  hoursToMinutes,
  minutesToHours,
  scheduleToInputs,
  weekTargetTotal,
} from "@/lib/rules";
import type { DayScheduleInput, WeeklySchedule } from "@/types/database";

type Props = {
  familyId: string;
  schedule: WeeklySchedule[];
  onUpdated: () => void;
};

type RowState = {
  day_of_week: number;
  studyHomeHours: number;
  studyNHours: number;
  jukuHours: number;
};

function toRows(inputs: DayScheduleInput[]): RowState[] {
  return inputs.map((d) => ({
    day_of_week: d.day_of_week,
    studyHomeHours: minutesToHours(d.study_home_minutes),
    studyNHours: minutesToHours(d.study_n_minutes),
    jukuHours: minutesToHours(d.juku_minutes),
  }));
}

export function WeeklyScheduleEditor({ familyId, schedule, onUpdated }: Props) {
  const supabase = createClient();
  const [rows, setRows] = useState<RowState[]>(() =>
    toRows(schedule.length > 0 ? scheduleToInputs(schedule) : emptyWeekInputs()),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputs = rows.map((r) => ({
    day_of_week: r.day_of_week,
    study_home_minutes: hoursToMinutes(r.studyHomeHours),
    study_n_minutes: hoursToMinutes(r.studyNHours),
    juku_minutes: hoursToMinutes(r.jukuHours),
  }));
  const weekTotal = weekTargetTotal(inputs);

  useEffect(() => {
    setRows(
      toRows(schedule.length > 0 ? scheduleToInputs(schedule) : emptyWeekInputs()),
    );
  }, [schedule]);

  function updateRow(
    dow: number,
    field: keyof Omit<RowState, "day_of_week">,
    value: number,
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.day_of_week === dow ? { ...r, [field]: Math.max(0, value) } : r,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = inputs.map((d) => ({
      family_id: familyId,
      day_of_week: d.day_of_week,
      study_home_minutes: d.study_home_minutes,
      study_n_minutes: d.study_n_minutes,
      juku_minutes: d.juku_minutes,
      study_minutes: d.study_home_minutes,
    }));

    const { error: deleteErr } = await supabase
      .from("weekly_schedule")
      .delete()
      .eq("family_id", familyId);

    if (deleteErr) {
      setSaving(false);
      setError(deleteErr.message);
      return;
    }

    const { error: insertErr } = await supabase.from("weekly_schedule").insert(payload);

    setSaving(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setMessage("曜日ごとの目標時間を保存しました");
    onUpdated();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">曜日ごとの目標時間</h3>
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          週合計 {formatMinutes(weekTotal)}
        </p>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        月水金=塾2h、火木=自習(自宅)2h が初期値です。土日・N高は0のまま変更できます。
      </p>

      <div className="mb-1 hidden grid-cols-[1.5rem_1fr_1fr_1fr_3rem] gap-1 px-1 text-[10px] text-zinc-400 sm:grid">
        <span />
        <span>自習(自宅)</span>
        <span>自習(N高)</span>
        <span>塾</span>
        <span className="text-right">合計</span>
      </div>

      <div className="space-y-1.5">
        {DAY_ORDER.map((dow) => {
          const row = rows.find((r) => r.day_of_week === dow)!;
          const dayInput = inputs.find((d) => d.day_of_week === dow)!;
          const dayTotal = dayTargetTotal(dayInput);
          return (
            <div
              key={dow}
              className="grid grid-cols-[1.5rem_1fr_1fr_1fr_3rem] items-center gap-1 rounded-xl bg-zinc-50 px-2 py-1.5 dark:bg-zinc-800/50"
            >
              <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {DAY_LABELS[dow]}
              </span>
              {(
                [
                  ["studyHomeHours", "自宅"] as const,
                  ["studyNHours", "N高"] as const,
                  ["jukuHours", "塾"] as const,
                ]
              ).map(([field]) => (
                <label key={field} className="flex items-center gap-0.5 text-xs">
                  <input
                    type="number"
                    min={0}
                    max={12}
                    step={0.5}
                    value={row[field]}
                    onChange={(e) =>
                      updateRow(dow, field, parseFloat(e.target.value) || 0)
                    }
                    className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    aria-label={`${DAY_LABELS[dow]} ${field}`}
                  />
                  <span className="shrink-0 text-zinc-400">h</span>
                </label>
              ))}
              <span className="text-right text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                {dayTotal > 0 ? formatMinutes(dayTotal) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "保存中…" : "目標時間を保存"}
      </button>
    </section>
  );
}

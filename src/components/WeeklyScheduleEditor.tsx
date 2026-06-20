"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DAY_LABELS,
  DAY_ORDER,
  emptyWeekInputs,
  hoursToMinutes,
  minutesToHours,
  scheduleToInputs,
} from "@/lib/rules";
import type { DayScheduleInput, WeeklySchedule } from "@/types/database";

type Props = {
  familyId: string;
  schedule: WeeklySchedule[];
  onUpdated: () => void;
};

type RowState = {
  day_of_week: number;
  studyHours: number;
  jukuHours: number;
};

function toRows(inputs: DayScheduleInput[]): RowState[] {
  return inputs.map((d) => ({
    day_of_week: d.day_of_week,
    studyHours: minutesToHours(d.study_minutes),
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

  useEffect(() => {
    setRows(
      toRows(schedule.length > 0 ? scheduleToInputs(schedule) : emptyWeekInputs()),
    );
  }, [schedule]);

  function updateRow(dow: number, field: "studyHours" | "jukuHours", value: number) {
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

    const payload = rows.map((r) => ({
      family_id: familyId,
      day_of_week: r.day_of_week,
      study_minutes: hoursToMinutes(r.studyHours),
      juku_minutes: hoursToMinutes(r.jukuHours),
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
      <h3 className="mb-1 text-sm font-bold">曜日ごとの目標時間</h3>
      <p className="mb-4 text-xs text-zinc-500">
        月〜日それぞれに、自習と塾の目標時間（時間）を設定します。0時間の項目は対象外です。
      </p>

      <div className="space-y-2">
        {DAY_ORDER.map((dow) => {
          const row = rows.find((r) => r.day_of_week === dow)!;
          return (
            <div
              key={dow}
              className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
            >
              <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {DAY_LABELS[dow]}
              </span>
              <label className="flex items-center gap-1 text-xs">
                <span className="w-8 shrink-0 text-zinc-500">自習</span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={row.studyHours}
                  onChange={(e) =>
                    updateRow(dow, "studyHours", parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
                <span className="text-zinc-400">h</span>
              </label>
              <label className="flex items-center gap-1 text-xs">
                <span className="w-8 shrink-0 text-zinc-500">塾</span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={0.5}
                  value={row.jukuHours}
                  onChange={(e) =>
                    updateRow(dow, "jukuHours", parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
                <span className="text-zinc-400">h</span>
              </label>
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

"use client";

import { format } from "date-fns";
import type { DayEvaluation, StudySession } from "@/types/database";
import { formatMinutes, sessionMinutes } from "@/lib/rules";

type Props = {
  evaluation: DayEvaluation;
  isChild: boolean;
  todaySessions?: StudySession[];
};

function ProgressRow({
  label,
  actual,
  target,
}: {
  label: string;
  actual: number;
  target: number;
}) {
  if (target <= 0) return null;
  const pct = Math.min(100, Math.round((actual / target) * 100));
  const met = actual >= target;
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="font-medium tabular-nums">
          {formatMinutes(actual)} / {formatMinutes(target)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${met ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TodayProgress({ evaluation, isChild, todaySessions = [] }: Props) {
  const {
    status,
    label,
    studyMinutes,
    jukuMinutes,
    studyTargetMinutes,
    jukuTargetMinutes,
    totalMinutes,
    targetMinutes,
  } = evaluation;

  const statusText = {
    none: "未記録",
    partial: "途中",
    met: "達成",
    future: "—",
  }[status];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">今日の進捗</h2>
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
            status === "met"
              ? "bg-emerald-100 text-emerald-700"
              : status === "partial"
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {statusText}
        </span>
      </div>

      <p className="text-sm text-zinc-500">
        今日の目標：<strong className="text-zinc-800 dark:text-zinc-100">{label}</strong>
      </p>

      {targetMinutes > 0 ? (
        <p className="mt-2 text-2xl font-bold tabular-nums">
          {formatMinutes(totalMinutes)}
          <span className="text-base font-normal text-zinc-500">
            {" "}
            / {formatMinutes(targetMinutes)}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums">{formatMinutes(totalMinutes)}</p>
      )}

      <ProgressRow label="自習" actual={studyMinutes} target={studyTargetMinutes} />
      <ProgressRow label="塾" actual={jukuMinutes} target={jukuTargetMinutes} />

      {todaySessions.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold text-zinc-500">
            本日の記録（{todaySessions.length}回・合算）
          </p>
          <ul className="space-y-1.5">
            {todaySessions.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-300"
              >
                <span className="min-w-0 truncate">
                  {format(new Date(s.started_at), "HH:mm")}–
                  {s.ended_at ? format(new Date(s.ended_at), "HH:mm") : "—"}
                  {s.kind === "juku" ? " · 塾" : " · 自習"}
                  {s.transcript_start ? ` · ${s.transcript_start}` : ""}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatMinutes(sessionMinutes(s))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isChild && (
        <p className="mt-3 text-xs text-zinc-400">親モード：閲覧のみ</p>
      )}
    </section>
  );
}

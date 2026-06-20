"use client";

import type { DayEvaluation } from "@/types/database";
import { formatMinutes } from "@/lib/rules";

type Props = {
  evaluation: DayEvaluation;
  isChild: boolean;
};

export function TodayProgress({ evaluation, isChild }: Props) {
  const { status, totalMinutes, targetMinutes, label } = evaluation;

  const pct =
    targetMinutes && targetMinutes > 0
      ? Math.min(100, Math.round((totalMinutes / targetMinutes) * 100))
      : status === "juku_met"
        ? 100
        : 0;

  const statusText = {
    none: "未記録",
    partial: "途中",
    met: "達成",
    juku_met: "塾 OK",
    future: "—",
  }[status];

  const barColor =
    status === "met" || status === "juku_met"
      ? "bg-emerald-500"
      : status === "partial"
        ? "bg-amber-400"
        : "bg-zinc-300 dark:bg-zinc-600";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">今日の進捗</h2>
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
            status === "met" || status === "juku_met"
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

      {targetMinutes !== null ? (
        <>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatMinutes(totalMinutes)}
            <span className="text-base font-normal text-zinc-500">
              {" "}
              / {formatMinutes(targetMinutes)}
            </span>
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums">
          {status === "juku_met" ? "塾に行きました" : formatMinutes(totalMinutes)}
        </p>
      )}

      {!isChild && (
        <p className="mt-3 text-xs text-zinc-400">親モード：閲覧のみ</p>
      )}
    </section>
  );
}

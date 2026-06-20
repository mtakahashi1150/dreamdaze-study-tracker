"use client";

import type { DayEvaluation, StudySession } from "@/types/database";
import { EditableSessionList } from "@/components/EditableSessionList";
import { formatMinutes } from "@/lib/rules";

type Props = {
  evaluation: DayEvaluation;
  isChild: boolean;
  todaySessions?: StudySession[];
  onUpdated?: () => void;
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

export function TodayProgress({
  evaluation,
  isChild,
  todaySessions = [],
  onUpdated,
}: Props) {
  const {
    status,
    label,
    studyHomeMinutes,
    studyNMinutes,
    jukuMinutes,
    studyHomeTargetMinutes,
    studyNTargetMinutes,
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

      <ProgressRow label="自習(自宅)" actual={studyHomeMinutes} target={studyHomeTargetMinutes} />
      <ProgressRow label="自習(N高)" actual={studyNMinutes} target={studyNTargetMinutes} />
      <ProgressRow label="塾" actual={jukuMinutes} target={jukuTargetMinutes} />

      {todaySessions.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold text-zinc-500">
            本日の記録（{todaySessions.length}回・合算）
            {isChild && (
              <span className="ml-1 font-normal text-zinc-400">
                · 各行の「編集」で修正できます
              </span>
            )}
          </p>
          <EditableSessionList
            sessions={todaySessions}
            isChild={isChild}
            onUpdated={onUpdated}
            compact
            emptyMessage=""
          />
        </div>
      )}

      {!isChild && (
        <p className="mt-3 text-xs text-zinc-400">
          親モード：閲覧のみ。「手入力」印は手で追加・修正した記録です。
        </p>
      )}
    </section>
  );
}

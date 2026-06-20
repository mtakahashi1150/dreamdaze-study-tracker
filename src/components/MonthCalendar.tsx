"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { DayEvaluation, StudySession, WeeklySchedule } from "@/types/database";
import {
  evaluateDay,
  formatMinutes,
  monthGrid,
  sessionMinutes,
  statusColor,
} from "@/lib/rules";

type Props = {
  sessions: StudySession[];
  weeklySchedule: WeeklySchedule[];
  onDayClick?: (dateKey: string) => void;
};

export function MonthCalendar({ sessions, weeklySchedule, onDayClick }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const days = useMemo(() => monthGrid(year, month), [year, month]);

  const evaluations = useMemo(() => {
    const map = new Map<string, DayEvaluation>();
    for (const d of days) {
      const ev = evaluateDay(d, sessions, weeklySchedule);
      map.set(ev.dateKey, ev);
    }
    return map;
  }, [days, sessions, weeklySchedule]);

  const metCount = [...evaluations.values()].filter((e) => e.status === "met").length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">
            {format(cursor, "yyyy年M月", { locale: ja })}
          </h2>
          <p className="text-xs text-zinc-500">達成 {metCount} 日</p>
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const ev = evaluations.get(key)!;
          const inMonth = d.getMonth() === month;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(key)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${
                inMonth ? "" : "opacity-30"
              } hover:ring-2 hover:ring-violet-400`}
            >
              <span className="mb-1 font-medium">{d.getDate()}</span>
              <span
                className={`h-2 w-2 rounded-full ${statusColor(ev.status)}`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          達成
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          途中
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
          未記録
        </span>
      </div>
    </section>
  );
}

export function DaySessionList({
  dateKey,
  sessions,
}: {
  dateKey: string;
  sessions: StudySession[];
}) {
  const daySessions = sessions.filter(
    (s) => format(parseISO(s.started_at), "yyyy-MM-dd") === dateKey,
  );

  if (daySessions.length === 0) {
    return <p className="text-sm text-zinc-500">この日の記録はありません。</p>;
  }

  return (
    <ul className="space-y-2">
      {daySessions.map((s) => (
        <li
          key={s.id}
          className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700"
        >
          <p className="font-medium">
            {format(parseISO(s.started_at), "HH:mm")}
            {s.ended_at && ` — ${format(parseISO(s.ended_at), "HH:mm")}`}
            {" · "}
            {formatMinutes(sessionMinutes(s))}
            {s.kind === "juku" ? (
              <span className="ml-2 rounded bg-violet-100 px-1.5 text-violet-700">塾</span>
            ) : (
              <span className="ml-2 rounded bg-zinc-100 px-1.5 text-zinc-600">自習</span>
            )}
          </p>
          {s.transcript_start && (
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">開始：{s.transcript_start}</p>
          )}
          {s.transcript_end && (
            <p className="text-zinc-600 dark:text-zinc-300">終了：{s.transcript_end}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

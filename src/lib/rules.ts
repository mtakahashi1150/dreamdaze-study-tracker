import {
  addDays,
  format,
  getDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";
import type {
  DayEvaluation,
  DayScheduleInput,
  DayStatus,
  StudySession,
  WeeklySchedule,
} from "@/types/database";

/** 表示順: 月〜日 */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_LABELS: Record<number, string> = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function sessionMinutes(session: StudySession): number {
  if (!session.ended_at) return 0;
  const start = new Date(session.started_at).getTime();
  const end = new Date(session.ended_at).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function sessionsForDay(
  sessions: StudySession[],
  day: Date,
): StudySession[] {
  const key = dateKey(day);
  return sessions.filter((s) => dateKey(parseISO(s.started_at)) === key);
}

export function minutesForKind(
  sessions: StudySession[],
  kind: "study" | "juku",
): number {
  return sessions
    .filter((s) => s.kind === kind)
    .reduce((sum, s) => sum + sessionMinutes(s), 0);
}

export function detectKind(transcript: string): "study" | "juku" {
  if (/塾|じゅく|JUKU/i.test(transcript)) return "juku";
  return "study";
}

export function getDaySchedule(
  dow: number,
  schedule: WeeklySchedule[],
): { study_minutes: number; juku_minutes: number } {
  const row = schedule.find((s) => s.day_of_week === dow);
  return {
    study_minutes: row?.study_minutes ?? 0,
    juku_minutes: row?.juku_minutes ?? 0,
  };
}

export function scheduleLabel(study: number, juku: number): string {
  const parts: string[] = [];
  if (study > 0) parts.push(`自習${formatMinutes(study)}`);
  if (juku > 0) parts.push(`塾${formatMinutes(juku)}`);
  return parts.length > 0 ? parts.join("・") : "休み";
}

export function evaluateDay(
  date: Date,
  sessions: StudySession[],
  schedule: WeeklySchedule[],
): DayEvaluation {
  const key = dateKey(date);
  const todayKey = dateKey(new Date());
  if (key > todayKey) {
    return {
      dateKey: key,
      status: "future",
      studyMinutes: 0,
      jukuMinutes: 0,
      studyTargetMinutes: 0,
      jukuTargetMinutes: 0,
      totalMinutes: 0,
      targetMinutes: 0,
      label: "—",
    };
  }

  const daySessions = sessionsForDay(sessions, date);
  const studyMinutes = minutesForKind(daySessions, "study");
  const jukuMinutes = minutesForKind(daySessions, "juku");
  const totalMinutes = studyMinutes + jukuMinutes;

  const { study_minutes, juku_minutes } = getDaySchedule(getDay(date), schedule);
  const targetMinutes = study_minutes + juku_minutes;
  const label = scheduleLabel(study_minutes, juku_minutes);

  if (study_minutes === 0 && juku_minutes === 0) {
    return {
      dateKey: key,
      status: totalMinutes > 0 ? "partial" : "none",
      studyMinutes,
      jukuMinutes,
      studyTargetMinutes: 0,
      jukuTargetMinutes: 0,
      totalMinutes,
      targetMinutes: 0,
      label,
    };
  }

  const studyMet = study_minutes === 0 || studyMinutes >= study_minutes;
  const jukuMet = juku_minutes === 0 || jukuMinutes >= juku_minutes;

  let status: DayStatus = "none";
  if (studyMet && jukuMet) status = "met";
  else if (totalMinutes > 0) status = "partial";

  return {
    dateKey: key,
    status,
    studyMinutes,
    jukuMinutes,
    studyTargetMinutes: study_minutes,
    jukuTargetMinutes: juku_minutes,
    totalMinutes,
    targetMinutes,
    label,
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 2) / 2;
}

export function formatDateJa(date: Date): string {
  return format(date, "M月d日（EEE）", { locale: ja });
}

export function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

export function statusColor(status: DayStatus): string {
  switch (status) {
    case "met":
      return "bg-emerald-500";
    case "partial":
      return "bg-amber-400";
    case "future":
      return "bg-zinc-200 dark:bg-zinc-700";
    default:
      return "bg-zinc-300 dark:bg-zinc-600";
  }
}

export function scheduleToInputs(schedule: WeeklySchedule[]): DayScheduleInput[] {
  return DAY_ORDER.map((dow) => {
    const row = schedule.find((s) => s.day_of_week === dow);
    return {
      day_of_week: dow,
      study_minutes: row?.study_minutes ?? 0,
      juku_minutes: row?.juku_minutes ?? 0,
    };
  });
}

export function emptyWeekInputs(): DayScheduleInput[] {
  return DAY_ORDER.map((dow) => ({
    day_of_week: dow,
    study_minutes: 0,
    juku_minutes: 0,
  }));
}

import {
  addDays,
  format,
  getDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { DayEvaluation, DayStatus, StudySession, WeekPlan } from "@/types/database";

const WEEKDAY_TARGET_MIN = 120; // 火・木 2時間
const JUKU_DAYS = new Set([1, 3, 5]); // 月=1, 水=3, 金=5 (date-fns: 0=日)

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getSaturdayWeekStart(date: Date): string {
  const day = getDay(date);
  const saturday = addDays(date, day === 6 ? 0 : day === 0 ? -1 : 6 - day);
  return dateKey(saturday);
}

export function getWeekPlanForDate(
  date: Date,
  plans: WeekPlan[],
): { sat_hours: 4 | 9; sun_hours: 4 | 9 } {
  const weekStart = getSaturdayWeekStart(date);
  const found = plans.find((p) => p.week_start === weekStart);
  return found
    ? { sat_hours: found.sat_hours, sun_hours: found.sun_hours }
    : { sat_hours: 4, sun_hours: 9 };
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

export function totalMinutesForDay(
  sessions: StudySession[],
  day: Date,
): number {
  return sessionsForDay(sessions, day).reduce(
    (sum, s) => sum + sessionMinutes(s),
    0,
  );
}

export function detectKind(transcript: string): "study" | "juku" {
  if (/塾|じゅく|JUKU/i.test(transcript)) return "juku";
  return "study";
}

export function dayTargetMinutes(date: Date, weekPlan: { sat_hours: 4 | 9; sun_hours: 4 | 9 }): {
  minutes: number | null;
  label: string;
  isJukuDay: boolean;
} {
  const dow = getDay(date);
  if (JUKU_DAYS.has(dow)) {
    return { minutes: null, label: "塾", isJukuDay: true };
  }
  if (dow === 2 || dow === 4) {
    return { minutes: WEEKDAY_TARGET_MIN, label: "2時間", isJukuDay: false };
  }
  if (dow === 6) {
    return {
      minutes: weekPlan.sat_hours * 60,
      label: `${weekPlan.sat_hours}時間`,
      isJukuDay: false,
    };
  }
  if (dow === 0) {
    return {
      minutes: weekPlan.sun_hours * 60,
      label: `${weekPlan.sun_hours}時間`,
      isJukuDay: false,
    };
  }
  return { minutes: null, label: "—", isJukuDay: false };
}

export function evaluateDay(
  date: Date,
  sessions: StudySession[],
  weekPlans: WeekPlan[],
): DayEvaluation {
  const key = dateKey(date);
  const todayKey = dateKey(new Date());
  if (key > todayKey) {
    return {
      dateKey: key,
      status: "future",
      totalMinutes: 0,
      targetMinutes: null,
      label: "—",
    };
  }

  const daySessions = sessionsForDay(sessions, date);
  const totalMinutes = daySessions.reduce(
    (sum, s) => sum + sessionMinutes(s),
    0,
  );
  const weekPlan = getWeekPlanForDate(date, weekPlans);
  const target = dayTargetMinutes(date, weekPlan);

  if (target.isJukuDay) {
    const hasJuku =
      daySessions.some((s) => s.kind === "juku") ||
      daySessions.some(
        (s) =>
          detectKind(s.transcript_start ?? "") === "juku" ||
          detectKind(s.transcript_end ?? "") === "juku",
      );
    return {
      dateKey: key,
      status: hasJuku ? "juku_met" : totalMinutes > 0 ? "partial" : "none",
      totalMinutes,
      targetMinutes: null,
      label: "塾",
    };
  }

  if (target.minutes === null) {
    return {
      dateKey: key,
      status: "none",
      totalMinutes,
      targetMinutes: null,
      label: target.label,
    };
  }

  let status: DayStatus = "none";
  if (totalMinutes >= target.minutes) status = "met";
  else if (totalMinutes > 0) status = "partial";

  return {
    dateKey: key,
    status,
    totalMinutes,
    targetMinutes: target.minutes,
    label: target.label,
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
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
    case "juku_met":
      return "bg-violet-500";
    case "partial":
      return "bg-amber-400";
    case "future":
      return "bg-zinc-200 dark:bg-zinc-700";
    default:
      return "bg-zinc-300 dark:bg-zinc-600";
  }
}

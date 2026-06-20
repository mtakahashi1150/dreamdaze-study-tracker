import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { ja } from "date-fns/locale";
import type {
  DayEvaluation,
  DayScheduleInput,
  DayStatus,
  KindBreakdown,
  PeriodStats,
  SessionKind,
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

export const KIND_LABELS: Record<SessionKind, string> = {
  juku: "塾",
  study_home: "自習(自宅)",
  study_n: "自習(N高)",
};

/** 初期目標: 月水金=塾2h, 火木=自習(自宅)2h, 土日=0 */
export const DEFAULT_WEEK_SCHEDULE: DayScheduleInput[] = [
  { day_of_week: 1, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 120 },
  { day_of_week: 2, study_home_minutes: 120, study_n_minutes: 0, juku_minutes: 0 },
  { day_of_week: 3, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 120 },
  { day_of_week: 4, study_home_minutes: 120, study_n_minutes: 0, juku_minutes: 0 },
  { day_of_week: 5, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 120 },
  { day_of_week: 6, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 0 },
  { day_of_week: 0, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 0 },
];

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function sessionMinutes(session: StudySession): number {
  if (!session.ended_at) return 0;
  const start = new Date(session.started_at).getTime();
  const end = new Date(session.ended_at).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function normalizeKind(kind: string): SessionKind {
  if (kind === "juku") return "juku";
  if (kind === "study_n") return "study_n";
  if (kind === "study_home" || kind === "study") return "study_home";
  return "study_home";
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
  kind: SessionKind,
): number {
  return sessions
    .filter((s) => normalizeKind(s.kind) === kind)
    .reduce((sum, s) => sum + sessionMinutes(s), 0);
}

export function detectKind(transcript: string): SessionKind {
  if (/塾|じゅく|JUKU/i.test(transcript)) return "juku";
  if (/N高|えぬこう|エヌコウ/i.test(transcript)) return "study_n";
  return "study_home";
}

export function getDaySchedule(
  dow: number,
  schedule: WeeklySchedule[],
): DayScheduleInput {
  const row = schedule.find((s) => s.day_of_week === dow);
  if (!row) {
    const def = DEFAULT_WEEK_SCHEDULE.find((d) => d.day_of_week === dow);
    return def ?? { day_of_week: dow, study_home_minutes: 0, study_n_minutes: 0, juku_minutes: 0 };
  }
  return {
    day_of_week: dow,
    study_home_minutes: row.study_home_minutes ?? row.study_minutes ?? 0,
    study_n_minutes: row.study_n_minutes ?? 0,
    juku_minutes: row.juku_minutes ?? 0,
  };
}

export function scheduleLabel(
  home: number,
  nHigh: number,
  juku: number,
): string {
  const parts: string[] = [];
  if (home > 0) parts.push(`自習(自宅)${formatMinutes(home)}`);
  if (nHigh > 0) parts.push(`自習(N高)${formatMinutes(nHigh)}`);
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
    return emptyEvaluation(key, "—", "future");
  }

  const daySessions = sessionsForDay(sessions, date);
  const studyHomeMinutes = minutesForKind(daySessions, "study_home");
  const studyNMinutes = minutesForKind(daySessions, "study_n");
  const jukuMinutes = minutesForKind(daySessions, "juku");
  const totalMinutes = studyHomeMinutes + studyNMinutes + jukuMinutes;

  const {
    study_home_minutes,
    study_n_minutes,
    juku_minutes,
  } = getDaySchedule(getDay(date), schedule);
  const targetMinutes = study_home_minutes + study_n_minutes + juku_minutes;
  const label = scheduleLabel(study_home_minutes, study_n_minutes, juku_minutes);

  if (targetMinutes === 0) {
    return {
      dateKey: key,
      status: totalMinutes > 0 ? "partial" : "none",
      studyHomeMinutes,
      studyNMinutes,
      jukuMinutes,
      studyHomeTargetMinutes: 0,
      studyNTargetMinutes: 0,
      jukuTargetMinutes: 0,
      totalMinutes,
      targetMinutes: 0,
      label,
    };
  }

  const homeMet =
    study_home_minutes === 0 || studyHomeMinutes >= study_home_minutes;
  const nMet = study_n_minutes === 0 || studyNMinutes >= study_n_minutes;
  const jukuMet = juku_minutes === 0 || jukuMinutes >= juku_minutes;

  let status: DayStatus = "none";
  if (homeMet && nMet && jukuMet) status = "met";
  else if (totalMinutes > 0) status = "partial";

  return {
    dateKey: key,
    status,
    studyHomeMinutes,
    studyNMinutes,
    jukuMinutes,
    studyHomeTargetMinutes: study_home_minutes,
    studyNTargetMinutes: study_n_minutes,
    jukuTargetMinutes: juku_minutes,
    totalMinutes,
    targetMinutes,
    label,
  };
}

function emptyEvaluation(
  dateKey: string,
  label: string,
  status: DayStatus,
): DayEvaluation {
  return {
    dateKey,
    status,
    studyHomeMinutes: 0,
    studyNMinutes: 0,
    jukuMinutes: 0,
    studyHomeTargetMinutes: 0,
    studyNTargetMinutes: 0,
    jukuTargetMinutes: 0,
    totalMinutes: 0,
    targetMinutes: 0,
    label,
  };
}

export function breakdownFromSessions(sessions: StudySession[]): KindBreakdown {
  const juku = minutesForKind(sessions, "juku");
  const study_home = minutesForKind(sessions, "study_home");
  const study_n = minutesForKind(sessions, "study_n");
  return { juku, study_home, study_n, total: juku + study_home + study_n };
}

export function sessionsInRange(
  sessions: StudySession[],
  start: Date,
  end: Date,
): StudySession[] {
  const startMs = start.getTime();
  const endMs = end.getTime() + 86400000 - 1;
  return sessions.filter((s) => {
    if (!s.ended_at) return false;
    const t = new Date(s.started_at).getTime();
    return t >= startMs && t <= endMs;
  });
}

export function computePeriodStats(
  label: string,
  sessions: StudySession[],
  periodStart: Date,
  periodEnd: Date,
): PeriodStats {
  const filtered = sessionsInRange(sessions, periodStart, periodEnd);
  const breakdown = breakdownFromSessions(filtered);
  const daysInPeriod =
    differenceInCalendarDays(periodEnd, periodStart) + 1;
  const averagePerDay =
    daysInPeriod > 0 ? Math.round(breakdown.total / daysInPeriod) : 0;

  return {
    label,
    periodStart: dateKey(periodStart),
    periodEnd: dateKey(periodEnd),
    daysInPeriod,
    breakdown,
    averagePerDay,
  };
}

export function buildStatsSummary(
  sessions: StudySession[],
  today = new Date(),
): {
  thisWeek: PeriodStats;
  rolling7: PeriodStats;
  thisMonth: PeriodStats;
} {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const rollingStart = subDays(today, 6);

  return {
    thisWeek: computePeriodStats(
      "今週（月〜今日）",
      sessions,
      weekStart,
      today,
    ),
    rolling7: computePeriodStats(
      "直近7日間",
      sessions,
      rollingStart,
      today,
    ),
    thisMonth: computePeriodStats(
      "今月",
      sessions,
      monthStart,
      today < monthEnd ? today : monthEnd,
    ),
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function formatMinutesDecimal(minutes: number): string {
  const h = (minutes / 60).toFixed(1);
  return `${h}時間`;
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
  if (schedule.length === 0) return DEFAULT_WEEK_SCHEDULE;
  return DAY_ORDER.map((dow) => getDaySchedule(dow, schedule));
}

export function emptyWeekInputs(): DayScheduleInput[] {
  return DEFAULT_WEEK_SCHEDULE;
}

export function dayTargetTotal(input: DayScheduleInput): number {
  return input.study_home_minutes + input.study_n_minutes + input.juku_minutes;
}

export function weekTargetTotal(inputs: DayScheduleInput[]): number {
  return inputs.reduce((sum, d) => sum + dayTargetTotal(d), 0);
}

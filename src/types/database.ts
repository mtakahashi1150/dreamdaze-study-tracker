export type MemberRole = "child" | "parent";
export type SessionKind = "juku" | "study_home" | "study_n";

export type Profile = {
  id: string;
  family_id: string;
  role: MemberRole;
  display_name: string;
  created_at: string;
};

export type Family = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type StudySession = {
  id: string;
  member_id: string;
  family_id: string;
  started_at: string;
  ended_at: string | null;
  transcript_start: string | null;
  transcript_end: string | null;
  kind: SessionKind;
  manual_edited: boolean;
  created_at: string;
};

/** date-fns getDay: 0=日, 1=月, …, 6=土 */
export type WeeklySchedule = {
  id: string;
  family_id: string;
  day_of_week: number;
  study_home_minutes: number;
  study_n_minutes: number;
  juku_minutes: number;
  /** @deprecated 互換用。study_home_minutes を使用 */
  study_minutes?: number;
  created_at: string;
};

export type DayStatus = "none" | "partial" | "met" | "future";

export type DayEvaluation = {
  dateKey: string;
  status: DayStatus;
  studyHomeMinutes: number;
  studyNMinutes: number;
  jukuMinutes: number;
  studyHomeTargetMinutes: number;
  studyNTargetMinutes: number;
  jukuTargetMinutes: number;
  totalMinutes: number;
  targetMinutes: number;
  label: string;
};

export type DayScheduleInput = {
  day_of_week: number;
  study_home_minutes: number;
  study_n_minutes: number;
  juku_minutes: number;
};

export type KindBreakdown = {
  juku: number;
  study_home: number;
  study_n: number;
  total: number;
};

export type PeriodStats = {
  label: string;
  periodStart: string;
  periodEnd: string;
  daysInPeriod: number;
  breakdown: KindBreakdown;
  averagePerDay: number;
};

export type MemberRole = "child" | "parent";
export type SessionKind = "study" | "juku";

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
  study_minutes: number;
  juku_minutes: number;
  created_at: string;
};

export type DayStatus = "none" | "partial" | "met" | "future";

export type DayEvaluation = {
  dateKey: string;
  status: DayStatus;
  studyMinutes: number;
  jukuMinutes: number;
  studyTargetMinutes: number;
  jukuTargetMinutes: number;
  totalMinutes: number;
  targetMinutes: number;
  label: string;
};

export type DayScheduleInput = {
  day_of_week: number;
  study_minutes: number;
  juku_minutes: number;
};

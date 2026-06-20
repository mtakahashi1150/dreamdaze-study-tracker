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

export type WeekPlan = {
  id: string;
  family_id: string;
  week_start: string;
  sat_hours: 4 | 9;
  sun_hours: 4 | 9;
  created_at: string;
};

export type DayStatus = "none" | "partial" | "met" | "juku_met" | "future";

export type DayEvaluation = {
  dateKey: string;
  status: DayStatus;
  totalMinutes: number;
  targetMinutes: number | null;
  label: string;
};

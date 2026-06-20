"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, StudySession, WeeklySchedule } from "@/types/database";

export function useFamilyData(childMemberId?: string) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [childProfile, setChildProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!me) {
      setLoading(false);
      return;
    }

    setProfile(me as Profile);

    let targetChildId = user.id;
    if (me.role === "parent") {
      const { data: children } = await supabase
        .from("profiles")
        .select("*")
        .eq("family_id", me.family_id)
        .eq("role", "child")
        .limit(1);

      const child = children?.[0] as Profile | undefined;
      if (child) {
        setChildProfile(child);
        targetChildId = childMemberId ?? child.id;
      }
    } else {
      setChildProfile(me as Profile);
    }

    const since = new Date();
    since.setMonth(since.getMonth() - 2);

    const { data: sess } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("family_id", me.family_id)
      .eq("member_id", targetChildId)
      .gte("started_at", since.toISOString())
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false });

    setSessions((sess as StudySession[]) ?? []);

    const { data: sched } = await supabase
      .from("weekly_schedule")
      .select("*")
      .eq("family_id", me.family_id)
      .order("day_of_week");

    setWeeklySchedule((sched as WeeklySchedule[]) ?? []);
    setLoading(false);
  }, [childMemberId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    childProfile,
    sessions,
    weeklySchedule,
    loading,
    refresh,
    isChild: profile?.role === "child",
  };
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { VoiceInput } from "@/components/VoiceInput";
import { createClient } from "@/lib/supabase/client";
import { detectKind } from "@/lib/rules";
import type { SessionKind, StudySession } from "@/types/database";

type Props = {
  profileId: string;
  familyId: string;
  onUpdated: () => void;
};

type Step = "idle" | "voice_start" | "running" | "voice_end";

export function SessionPanel({ profileId, familyId, onUpdated }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("idle");
  const [active, setActive] = useState<StudySession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>("study");

  useEffect(() => {
    void loadActive();
  }, []);

  useEffect(() => {
    if (!active?.started_at || active.ended_at) return;
    const tick = () => {
      setElapsed(
        Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  async function loadActive() {
    const { data } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("member_id", profileId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActive(data as StudySession);
      setStep("running");
    }
  }

  async function handleStartVoice(text: string) {
    setLoading(true);
    setError(null);
    const kind = detectKind(text) === "juku" ? "juku" : sessionKind;
    const { data, error: err } = await supabase
      .from("study_sessions")
      .insert({
        member_id: profileId,
        family_id: familyId,
        started_at: new Date().toISOString(),
        transcript_start: text,
        kind,
      })
      .select()
      .single();

    setLoading(false);
    if (err) {
      setError(err.message);
      setStep("voice_start");
      return;
    }
    setActive(data as StudySession);
    setStep("running");
    onUpdated();
  }

  async function handleEndVoice(text: string) {
    if (!active) {
      setError("終了対象のセッションが見つかりません。ページを再読み込みしてください。");
      return;
    }
    setLoading(true);
    setError(null);
    const kind =
      active.kind === "juku" || detectKind(text) === "juku" ? "juku" : "study";

    const { data, error: err } = await supabase
      .from("study_sessions")
      .update({
        ended_at: new Date().toISOString(),
        transcript_end: text,
        kind,
      })
      .eq("id", active.id)
      .select()
      .maybeSingle();

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data) {
      setError("終了の保存に失敗しました。ログインし直すか、もう一度お試しください。");
      return;
    }
    setActive(null);
    setStep("idle");
    setElapsed(0);
    onUpdated();
  }

  const elapsedLabel = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(
    Math.floor((elapsed % 3600) / 60),
  ).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  if (step === "idle") {
    return (
      <section className="space-y-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => setStep("voice_start")}
          className="w-full rounded-2xl bg-violet-600 py-6 text-xl font-bold text-white shadow-lg hover:bg-violet-700 disabled:opacity-50"
        >
          学習を開始する
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>
    );
  }

  if (step === "voice_start") {
    return (
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSessionKind("study")}
            className={`rounded-xl py-2 text-sm font-medium ${
              sessionKind === "study"
                ? "bg-violet-600 text-white"
                : "border border-zinc-300 dark:border-zinc-600"
            }`}
          >
            自習
          </button>
          <button
            type="button"
            onClick={() => setSessionKind("juku")}
            className={`rounded-xl py-2 text-sm font-medium ${
              sessionKind === "juku"
                ? "bg-violet-600 text-white"
                : "border border-zinc-300 dark:border-zinc-600"
            }`}
          >
            塾
          </button>
        </div>
        <VoiceInput
          label="いまから何をする？（口頭で話してください）"
          onResult={(t) => void handleStartVoice(t)}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="w-full py-2 text-sm text-zinc-500"
        >
          キャンセル
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>
    );
  }

  if (step === "voice_end") {
    return (
      <section className="space-y-4">
        <VoiceInput
          label="何をやった？（口頭で話してください）"
          onResult={(t) => void handleEndVoice(t)}
          disabled={loading}
        />
        {loading && (
          <p className="text-center text-sm text-violet-600">終了を保存しています…</p>
        )}
        <button
          type="button"
          onClick={() => setStep("running")}
          className="w-full py-2 text-sm text-zinc-500"
        >
          戻る
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border-2 border-violet-300 bg-violet-50 p-5 dark:border-violet-700 dark:bg-violet-950/30">
      <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
        {active?.kind === "juku" ? "塾 · 学習中" : "自習 · 学習中"}
      </p>
      <p className="text-4xl font-bold tabular-nums tracking-tight">
        {elapsedLabel}
      </p>
      {active?.transcript_start && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          開始メモ：{active.transcript_start}
        </p>
      )}
      {active?.started_at && (
        <p className="text-xs text-zinc-400">
          開始 {format(new Date(active.started_at), "HH:mm")}
        </p>
      )}

      <button
        type="button"
        onClick={() => setStep("voice_end")}
        className="w-full rounded-2xl bg-rose-500 py-5 text-lg font-bold text-white hover:bg-rose-600"
      >
        終了する
      </button>

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </section>
  );
}

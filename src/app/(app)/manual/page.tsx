"use client";

import { useState } from "react";
import { VoiceInput } from "@/components/VoiceInput";
import { useFamilyData } from "@/hooks/useFamilyData";
import { createClient } from "@/lib/supabase/client";
import {
  detectKind,
  formatDateTimeLocal,
  parseDateTimeLocal,
} from "@/lib/rules";

export default function ManualPage() {
  const { profile, isChild, refresh } = useFamilyData();
  const supabase = createClient();
  const now = new Date();
  const [startedAt, setStartedAt] = useState(formatDateTimeLocal(now.toISOString()));
  const [endedAt, setEndedAt] = useState(
    formatDateTimeLocal(new Date(now.getTime() + 90 * 60000).toISOString()),
  );
  const [transcriptStart, setTranscriptStart] = useState("");
  const [transcriptEnd, setTranscriptEnd] = useState("");
  const [kind, setKind] = useState<"study" | "juku">("study");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isChild) {
    return (
      <main className="p-6 pt-8">
        <h1 className="text-xl font-bold">記録の追加</h1>
        <p className="mt-4 text-sm text-zinc-500">
          記録の追加は、お子さんのアカウントから行ってください。
        </p>
      </main>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const resolvedKind =
      detectKind(transcriptStart) === "juku" || detectKind(transcriptEnd) === "juku"
        ? "juku"
        : kind;

    const { error: err } = await supabase.from("study_sessions").insert({
      member_id: profile.id,
      family_id: profile.family_id,
      started_at: parseDateTimeLocal(startedAt),
      ended_at: parseDateTimeLocal(endedAt),
      transcript_start: transcriptStart || null,
      transcript_end: transcriptEnd || null,
      kind: resolvedKind,
      manual_edited: true,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("記録を保存しました");
    refresh();
  }

  return (
    <main className="space-y-5 p-4 pt-6 pb-8">
      <header>
        <h1 className="text-xl font-bold">記録の追加</h1>
        <p className="text-sm text-zinc-500">
          押し忘れた日の記録を後から追加します。保存すると「手入力」印が付きます。
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setKind("study")}
            className={`rounded-xl py-2 text-sm font-medium ${
              kind === "study"
                ? "bg-violet-600 text-white"
                : "border border-zinc-300 dark:border-zinc-600"
            }`}
          >
            自習
          </button>
          <button
            type="button"
            onClick={() => setKind("juku")}
            className={`rounded-xl py-2 text-sm font-medium ${
              kind === "juku"
                ? "bg-violet-600 text-white"
                : "border border-zinc-300 dark:border-zinc-600"
            }`}
          >
            塾
          </button>
        </div>

        <label className="block">
          <span className="text-sm font-medium">開始日時</span>
          <input
            type="datetime-local"
            required
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">終了日時</span>
          <input
            type="datetime-local"
            required
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>

        <VoiceInput
          label="開始メモ（音声または手入力）"
          onResult={setTranscriptStart}
        />
        {transcriptStart && (
          <p className="text-sm text-zinc-600">開始：{transcriptStart}</p>
        )}

        <VoiceInput
          label="終了メモ（音声または手入力）"
          onResult={setTranscriptEnd}
        />
        {transcriptEnd && (
          <p className="text-sm text-zinc-600">終了：{transcriptEnd}</p>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "保存中…" : "記録を保存"}
        </button>
      </form>
    </main>
  );
}

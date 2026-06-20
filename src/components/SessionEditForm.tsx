"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SESSION_KIND_OPTIONS } from "@/components/SessionBadges";
import {
  detectKind,
  formatDateTimeLocal,
  normalizeKind,
  parseDateTimeLocal,
} from "@/lib/rules";
import type { SessionKind, StudySession } from "@/types/database";

type Props = {
  session: StudySession;
  onSaved: () => void;
  onCancel: () => void;
};

export function SessionEditForm({ session, onSaved, onCancel }: Props) {
  const supabase = createClient();
  const [startedAt, setStartedAt] = useState(formatDateTimeLocal(session.started_at));
  const [endedAt, setEndedAt] = useState(
    session.ended_at
      ? formatDateTimeLocal(session.ended_at)
      : formatDateTimeLocal(session.started_at),
  );
  const [kind, setKind] = useState<SessionKind>(normalizeKind(session.kind));
  const [transcriptStart, setTranscriptStart] = useState(session.transcript_start ?? "");
  const [transcriptEnd, setTranscriptEnd] = useState(session.transcript_end ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const detected = detectKind(transcriptStart + transcriptEnd);
    const resolvedKind = detected !== "study_home" ? detected : kind;

    const { data, error: err } = await supabase
      .from("study_sessions")
      .update({
        started_at: parseDateTimeLocal(startedAt),
        ended_at: parseDateTimeLocal(endedAt),
        kind: resolvedKind,
        transcript_start: transcriptStart.trim() || null,
        transcript_end: transcriptEnd.trim() || null,
        manual_edited: true,
      })
      .eq("id", session.id)
      .select()
      .maybeSingle();

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data) {
      setError("保存に失敗しました。もう一度お試しください。");
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!confirm("この記録を削除しますか？")) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from("study_sessions")
      .delete()
      .eq("id", session.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="mt-2 space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800 dark:bg-violet-950/20">
      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
        記録を編集（保存すると「手入力」印が付きます）
      </p>

      <div className="grid grid-cols-3 gap-2">
        {SESSION_KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setKind(opt.value)}
            className={`rounded-lg py-1.5 text-[10px] font-medium ${
              kind === opt.value
                ? "bg-violet-600 text-white"
                : "border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="block text-xs">
        <span className="font-medium">開始</span>
        <input
          type="datetime-local"
          required
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>
      <label className="block text-xs">
        <span className="font-medium">終了</span>
        <input
          type="datetime-local"
          required
          value={endedAt}
          onChange={(e) => setEndedAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>
      <label className="block text-xs">
        <span className="font-medium">開始メモ（任意）</span>
        <input
          type="text"
          value={transcriptStart}
          onChange={(e) => setTranscriptStart(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>
      <label className="block text-xs">
        <span className="font-medium">終了メモ（任意）</span>
        <input
          type="text"
          value={transcriptEnd}
          onChange={(e) => setTranscriptEnd(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {loading ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-600"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={loading}
          className="rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-600 dark:border-rose-900"
        >
          削除
        </button>
      </div>
    </form>
  );
}

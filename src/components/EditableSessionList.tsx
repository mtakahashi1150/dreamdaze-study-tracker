"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { StudySession } from "@/types/database";
import { formatMinutes, sessionMinutes } from "@/lib/rules";
import { ManualEditedBadge, SessionKindBadge } from "@/components/SessionBadges";
import { SessionEditForm } from "@/components/SessionEditForm";

type Props = {
  sessions: StudySession[];
  dateKey?: string;
  isChild: boolean;
  onUpdated?: () => void;
  compact?: boolean;
  emptyMessage?: string;
};

function SessionComments({
  session,
  compact,
}: {
  session: StudySession;
  compact: boolean;
}) {
  const hasStart = Boolean(session.transcript_start?.trim());
  const hasEnd = Boolean(session.transcript_end?.trim());
  if (!hasStart && !hasEnd) return null;

  const textClass = compact
    ? "text-xs text-zinc-500 dark:text-zinc-400"
    : "text-zinc-600 dark:text-zinc-300";

  return (
    <div className={compact ? "mt-0.5 space-y-0.5" : "mt-1 space-y-0.5"}>
      {hasStart && <p className={textClass}>開始：{session.transcript_start}</p>}
      {hasEnd && <p className={textClass}>終了：{session.transcript_end}</p>}
    </div>
  );
}

export function EditableSessionList({
  sessions,
  dateKey,
  isChild,
  onUpdated,
  compact = false,
  emptyMessage = "記録はありません。",
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const daySessions = useMemo(() => {
    const filtered = dateKey
      ? sessions.filter((s) => format(parseISO(s.started_at), "yyyy-MM-dd") === dateKey)
      : sessions;
    return [...filtered].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
    );
  }, [sessions, dateKey]);

  if (daySessions.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  function handleSaved() {
    setEditingId(null);
    onUpdated?.();
  }

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {daySessions.map((s) => {
        const isEditing = editingId === s.id;
        return (
          <li
            key={s.id}
            className={`rounded-xl border ${
              isEditing
                ? "border-violet-300 dark:border-violet-700"
                : "border-zinc-200 dark:border-zinc-700"
            } ${compact ? "p-2" : "p-3"} text-sm`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${compact ? "text-sm" : ""}`}>
                  {format(parseISO(s.started_at), "HH:mm")}
                  {s.ended_at && ` – ${format(parseISO(s.ended_at), "HH:mm")}`}
                  <SessionKindBadge kind={s.kind} />
                  {s.manual_edited && <ManualEditedBadge />}
                </p>
                <SessionComments session={s} compact={compact} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-medium tabular-nums">
                  {formatMinutes(sessionMinutes(s))}
                </span>
                {isChild && (
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : s.id)}
                    className="text-xs text-violet-600 underline"
                  >
                    {isEditing ? "閉じる" : "編集"}
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <SessionEditForm
                session={s}
                onSaved={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import type { StudySession } from "@/types/database";

export function ManualEditedBadge() {
  return (
    <span className="ml-1.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      手入力
    </span>
  );
}

export function SessionKindBadge({ kind }: { kind: StudySession["kind"] }) {
  if (kind === "juku") {
    return (
      <span className="ml-1.5 shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
        塾
      </span>
    );
  }
  return (
    <span className="ml-1.5 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      自習
    </span>
  );
}

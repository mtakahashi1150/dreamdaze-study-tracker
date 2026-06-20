"use client";

import type { SessionKind } from "@/types/database";

export function ManualEditedBadge() {
  return (
    <span className="ml-1.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      手入力
    </span>
  );
}

export function SessionKindBadge({ kind }: { kind: string }) {
  const normalized =
    kind === "juku"
      ? "juku"
      : kind === "study_n"
        ? "study_n"
        : "study_home";
  const label =
    normalized === "juku"
      ? "塾"
      : normalized === "study_n"
        ? "N高"
        : "自宅";
  const cls =
    normalized === "juku"
      ? "bg-violet-100 text-violet-700"
      : normalized === "study_n"
        ? "bg-sky-100 text-sky-700"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span className={`ml-1.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

export const SESSION_KIND_OPTIONS: { value: SessionKind; label: string }[] = [
  { value: "study_home", label: "自習(自宅)" },
  { value: "study_n", label: "自習(N高)" },
  { value: "juku", label: "塾" },
];

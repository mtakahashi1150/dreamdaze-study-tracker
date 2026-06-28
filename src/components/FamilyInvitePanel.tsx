"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

type FamilyInfo = {
  name: string;
  invite_code: string;
  expected_child_name: string | null;
};

type Props = {
  familyId: string;
  childProfile: Profile | null;
};

export function FamilyInvitePanel({ familyId, childProfile }: Props) {
  const supabase = createClient();
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [parents, setParents] = useState<Profile[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: fam } = await supabase
        .from("families")
        .select("name, invite_code, expected_child_name")
        .eq("id", familyId)
        .single();
      if (fam) setFamily(fam as FamilyInfo);

      const { data: members } = await supabase
        .from("profiles")
        .select("*")
        .eq("family_id", familyId)
        .eq("role", "parent");
      setParents((members as Profile[]) ?? []);
    })();
  }, [familyId, supabase]);

  if (!family) return null;

  const childLabel =
    childProfile?.display_name ?? family.expected_child_name ?? "お子さん";
  const childJoined = Boolean(childProfile);

  async function copyCode(label: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/40">
      <h3 className="font-bold text-violet-900 dark:text-violet-100">
        家族の招待
      </h3>
      <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">
        {family.name} · 親 {parents.length}人
        {childJoined ? ` · ${childLabel}さん 参加済み` : ` · ${childLabel}さん 未参加`}
      </p>

      <div className="mt-4 space-y-3">
        <InviteBlock
          title="お子さん用"
          description={
            childJoined
              ? `${childLabel}さんは参加済みです`
              : `${childLabel}さんに Google でログイン →「子：招待コードで参加」`
          }
          code={family.invite_code}
          copied={copied === "child"}
          onCopy={() => void copyCode("child", family.invite_code)}
          muted={childJoined}
        />
        <InviteBlock
          title="2人目以降の親用（奥さんなど）"
          description="Google でログイン →「親：招待コードで参加」"
          code={family.invite_code}
          copied={copied === "parent"}
          onCopy={() => void copyCode("parent", family.invite_code)}
        />
      </div>
    </section>
  );
}

function InviteBlock({
  title,
  description,
  code,
  copied,
  onCopy,
  muted,
}: {
  title: string;
  description: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white p-3 dark:bg-zinc-900 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-lg font-bold tracking-widest dark:bg-zinc-800">
          {code}
        </code>
        {!muted && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
          >
            {copied ? "コピー済" : "コピー"}
          </button>
        )}
      </div>
    </div>
  );
}

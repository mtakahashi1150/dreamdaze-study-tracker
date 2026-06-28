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

const APP_ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://project-18ha2.vercel.app";

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
  const childUrl = `${APP_ORIGIN}/onboarding?step=join_child`;
  const parentUrl = `${APP_ORIGIN}/onboarding?step=join_parent`;

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied(null);
    }
  }

  const childMessage = `【学習トラッカー】${childLabel}さん用の招待です。

1. 次のURLを開いて Google でログイン
${childUrl}

2. 「子：招待コードで参加」を選ぶ
3. 招待コード: ${family.invite_code}`;

  const spouseMessage = `【学習トラッカー】親アカウントの招待です。

1. 次のURLを開いて Google でログイン
${parentUrl}

2. 「親：招待コードで参加」を選ぶ
3. 招待コード: ${family.invite_code}`;

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/40">
      <h3 className="font-bold text-violet-900 dark:text-violet-100">
        家族の招待
      </h3>
      <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">
        {family.name} · 親 {parents.length}人
        {childJoined
          ? ` · ${childLabel}さん 参加済み`
          : ` · ${childLabel}さん 未参加`}
      </p>

      <div className="mt-4 space-y-3">
        <InviteBlock
          title="お子さん用"
          description={
            childJoined
              ? `${childLabel}さんは参加済みです`
              : "招待文ごとコピーして LINE 等で送れます"
          }
          code={family.invite_code}
          link={childUrl}
          copied={copied === "child"}
          onCopyCode={() => void copyText("child-code", family.invite_code)}
          onCopyMessage={() => void copyText("child", childMessage)}
          copyMessageLabel="招待文をコピー"
          muted={childJoined}
        />
        <InviteBlock
          title="2人目以降の親用（奥さんなど）"
          description="同じ招待コード・別の参加URLです"
          code={family.invite_code}
          link={parentUrl}
          copied={copied === "parent"}
          onCopyCode={() => void copyText("parent-code", family.invite_code)}
          onCopyMessage={() => void copyText("parent", spouseMessage)}
          copyMessageLabel="妻用の招待文をコピー"
        />
      </div>
    </section>
  );
}

function InviteBlock({
  title,
  description,
  code,
  link,
  copied,
  onCopyCode,
  onCopyMessage,
  copyMessageLabel,
  muted,
}: {
  title: string;
  description: string;
  code: string;
  link: string;
  copied: boolean;
  onCopyCode: () => void;
  onCopyMessage: () => void;
  copyMessageLabel: string;
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
      <p className="mt-2 break-all text-[10px] text-zinc-400">{link}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-lg font-bold tracking-widest dark:bg-zinc-800">
          {code}
        </code>
        {!muted && (
          <button
            type="button"
            onClick={onCopyCode}
            className="shrink-0 rounded-lg border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 dark:border-violet-600 dark:text-violet-300"
          >
            コード
          </button>
        )}
      </div>
      {!muted && (
        <button
          type="button"
          onClick={onCopyMessage}
          className="mt-2 w-full rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white"
        >
          {copied ? "コピーしました" : copyMessageLabel}
        </button>
      )}
    </div>
  );
}

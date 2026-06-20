"use client";

import type { PeriodStats } from "@/types/database";
import { formatMinutes, formatMinutesDecimal } from "@/lib/rules";

type Props = {
  thisWeek: PeriodStats;
  rolling7: PeriodStats;
  thisMonth: PeriodStats;
};

const CATEGORIES = [
  { key: "study_home" as const, label: "自習(自宅)", color: "bg-zinc-500" },
  { key: "study_n" as const, label: "自習(N高)", color: "bg-sky-500" },
  { key: "juku" as const, label: "塾", color: "bg-violet-500" },
];

function StatCard({ stat }: { stat: PeriodStats }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-bold">{stat.label}</h3>
      <p className="mt-0.5 text-xs text-zinc-500">
        {stat.periodStart} 〜 {stat.periodEnd}（{stat.daysInPeriod}日）
      </p>
      <p className="mt-3 text-3xl font-bold tabular-nums">
        {formatMinutes(stat.breakdown.total)}
      </p>
      <p className="text-sm text-zinc-500">
        1日平均 {formatMinutes(stat.averagePerDay)}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
        <li>自習(自宅) {formatMinutes(stat.breakdown.study_home)}</li>
        <li>自習(N高) {formatMinutes(stat.breakdown.study_n)}</li>
        <li>塾 {formatMinutes(stat.breakdown.juku)}</li>
      </ul>
    </div>
  );
}

function ComparisonChart({
  thisWeek,
  rolling7,
  thisMonth,
}: {
  thisWeek: PeriodStats;
  rolling7: PeriodStats;
  thisMonth: PeriodStats;
}) {
  const periods = [
    { stat: thisWeek, short: "今週" },
    { stat: rolling7, short: "直近7日" },
    { stat: thisMonth, short: "今月" },
  ];

  const maxTotal = Math.max(
    ...periods.map((p) => p.stat.breakdown.total),
    60,
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-1 font-bold">期間比較（合計時間）</h3>
      <p className="mb-4 text-xs text-zinc-500">
        今週と直近7日を同じグラフで比べると、「先週との差」ではなく「この1週間でどれだけやったか」が見えます。
      </p>

      <div className="space-y-4">
        {periods.map(({ stat, short }) => {
          const pct = Math.round((stat.breakdown.total / maxTotal) * 100);
          return (
            <div key={short}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{short}</span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                  {formatMinutesDecimal(stat.breakdown.total)}
                  <span className="ml-2 text-xs text-zinc-400">
                    平均 {formatMinutes(stat.averagePerDay)}/日
                  </span>
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    short === "直近7日" ? "bg-violet-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(pct, stat.breakdown.total > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoryChart({
  thisWeek,
  rolling7,
}: {
  thisWeek: PeriodStats;
  rolling7: PeriodStats;
}) {
  const maxVal = Math.max(
    ...CATEGORIES.flatMap((c) => [
      thisWeek.breakdown[c.key],
      rolling7.breakdown[c.key],
    ]),
    30,
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-1 font-bold">内訳比較（今週 vs 直近7日）</h3>
      <p className="mb-4 text-xs text-zinc-500">
        種類ごとに並べると、塾・自宅・N高のバランスの変化が分かります。
      </p>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { stat: thisWeek, label: "今週" },
                { stat: rolling7, label: "7日" },
              ].map(({ stat, label }) => {
                const val = stat.breakdown[cat.key];
                const pct = Math.round((val / maxVal) * 100);
                return (
                  <div key={label}>
                    <div className="mb-0.5 flex justify-between text-[10px] text-zinc-400">
                      <span>{label}</span>
                      <span>{formatMinutes(val)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded ${cat.color}`}
                        style={{ width: `${Math.max(pct, val > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatsPanel({ thisWeek, rolling7, thisMonth }: Props) {
  return (
    <div className="space-y-5">
      <ComparisonChart
        thisWeek={thisWeek}
        rolling7={rolling7}
        thisMonth={thisMonth}
      />
      <CategoryChart thisWeek={thisWeek} rolling7={rolling7} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard stat={thisWeek} />
        <StatCard stat={rolling7} />
        <StatCard stat={thisMonth} />
      </div>
    </div>
  );
}

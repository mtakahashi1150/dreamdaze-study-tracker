"use client";

import type {
  DailyBreakdown,
  KindBreakdown,
  StatsSummary,
  WeekTrendPoint,
} from "@/types/database";
import {
  formatDelta,
  formatHoursShort,
  formatMinutes,
  formatMinutesDecimal,
} from "@/lib/rules";

type Props = StatsSummary;

const SEGMENTS = [
  { key: "study_home" as const, label: "自習(自宅)", fill: "#71717a" },
  { key: "study_n" as const, label: "自習(N高)", fill: "#0ea5e9" },
  { key: "juku" as const, label: "塾", fill: "#8b5cf6" },
];

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
      {SEGMENTS.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: s.fill }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function DeltaBadge({
  delta,
  compareLabel,
}: {
  delta: number;
  compareLabel: string;
}) {
  const up = delta > 0;
  const down = delta < 0;
  return (
    <div
      className={`text-sm font-medium ${
        up
          ? "text-emerald-600 dark:text-emerald-400"
          : down
            ? "text-amber-600 dark:text-amber-400"
            : "text-zinc-500"
      }`}
    >
      {compareLabel}{" "}
      <span className="tabular-nums">
        {formatDelta(delta)}
        {up && " ↑"}
        {down && " ↓"}
      </span>
    </div>
  );
}

function HeroSummary({ summary }: { summary: StatsSummary }) {
  const weekDelta =
    summary.thisWeek.breakdown.total -
    summary.lastWeekSamePeriod.breakdown.total;
  const weekAvgDelta =
    summary.thisWeek.averagePerDay - summary.lastWeekSamePeriod.averagePerDay;
  const rollingDelta =
    summary.rolling7.breakdown.total - summary.prevRolling7.breakdown.total;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-5 text-white shadow-lg">
      <p className="text-sm font-medium text-violet-200">今週の学習（月〜今日）</p>
      <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
        {formatMinutesDecimal(summary.thisWeek.breakdown.total)}
      </p>
      <p className="mt-1 text-sm text-violet-100">
        1日平均 {formatMinutes(summary.thisWeek.averagePerDay)}
      </p>
      <div className="mt-4 space-y-1 rounded-xl bg-white/10 px-3 py-2.5">
        <DeltaBadge delta={weekDelta} compareLabel="先週の同じ期間より" />
        <DeltaBadge delta={weekAvgDelta} compareLabel="先週の1日平均より" />
        <p className="text-xs text-violet-200/80">
          直近7日 {formatMinutes(summary.rolling7.breakdown.total)}
          <span className="ml-2">
            （前の7日比 {formatDelta(rollingDelta)}）
          </span>
        </p>
      </div>
    </section>
  );
}

function StackedBar({
  breakdown,
  maxTotal,
  barHeight,
  barWidth,
  x,
  highlight,
}: {
  breakdown: KindBreakdown;
  maxTotal: number;
  barHeight: number;
  barWidth: number;
  x: number;
  highlight?: boolean;
}) {
  let y = barHeight;
  const total = breakdown.total;

  return (
    <g>
      {total === 0 ? (
        <rect
          x={x}
          y={barHeight - 4}
          width={barWidth}
          height={4}
          fill="currentColor"
          className="text-zinc-200 dark:text-zinc-700"
          rx={2}
        />
      ) : (
        SEGMENTS.map((seg) => {
          const val = breakdown[seg.key];
          if (val <= 0) return null;
          const h = Math.max(2, (val / maxTotal) * barHeight);
          y -= h;
          return (
            <rect
              key={seg.key}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={seg.fill}
              rx={1}
            />
          );
        })
      )}
      {total > 0 && (
        <text
          x={x + barWidth / 2}
          y={y - 4}
          textAnchor="middle"
          className="fill-zinc-600 text-[9px] font-semibold dark:fill-zinc-300"
        >
          {formatHoursShort(total)}h
        </text>
      )}
      {highlight && total > 0 && (
        <rect
          x={x - 2}
          y={0}
          width={barWidth + 4}
          height={barHeight}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={2}
          rx={4}
        />
      )}
    </g>
  );
}

function DailyStackedChart({ days }: { days: DailyBreakdown[] }) {
  const maxTotal = Math.max(...days.map((d) => d.breakdown.total), 90);
  const barWidth = 28;
  const gap = 10;
  const barHeight = 140;
  const chartW = days.length * (barWidth + gap) - gap + 8;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-bold">1日ごとの学習（直近7日）</h3>
      <p className="mb-3 mt-0.5 text-xs text-zinc-500">
        棒の高さ＝その日の合計。色の積み上げで種類の内訳が分かります。
      </p>
      <Legend />
      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${barHeight + 44}`}
          className="mx-auto block w-full max-w-md"
          role="img"
          aria-label="直近7日間の学習時間の積み上げ棒グラフ"
        >
          {days.map((day, i) => {
            const x = i * (barWidth + gap) + 4;
            return (
              <g key={day.dateKey}>
                <StackedBar
                  breakdown={day.breakdown}
                  maxTotal={maxTotal}
                  barHeight={barHeight}
                  barWidth={barWidth}
                  x={x}
                  highlight={day.isToday}
                />
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 14}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    day.isToday
                      ? "fill-violet-600 font-bold dark:fill-violet-400"
                      : "fill-zinc-600 dark:fill-zinc-400"
                  }`}
                >
                  {day.dayLabel}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 26}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[9px]"
                >
                  {day.shortDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function WeekTrendChart({ weeks }: { weeks: WeekTrendPoint[] }) {
  const maxTotal = Math.max(...weeks.map((w) => w.breakdown.total), 120);
  const barWidth = 48;
  const gap = 16;
  const barHeight = 120;
  const chartW = weeks.length * (barWidth + gap) - gap + 8;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-bold">週ごとの推移（4週間）</h3>
      <p className="mb-3 mt-0.5 text-xs text-zinc-500">
        先週・先々週と比べて、今週は増えているか減っているかが分かります。
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${barHeight + 56}`}
          className="mx-auto block w-full max-w-sm"
          role="img"
          aria-label="4週間の学習時間推移"
        >
          {weeks.map((week, i) => {
            const x = i * (barWidth + gap) + 4;
            const total = week.breakdown.total;
            return (
              <g key={week.label}>
                <StackedBar
                  breakdown={week.breakdown}
                  maxTotal={maxTotal}
                  barHeight={barHeight}
                  barWidth={barWidth}
                  x={x}
                  highlight={week.isCurrent}
                />
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 16}
                  textAnchor="middle"
                  className={`text-xs ${
                    week.isCurrent
                      ? "fill-violet-600 font-bold dark:fill-violet-400"
                      : "fill-zinc-600 dark:fill-zinc-400"
                  }`}
                >
                  {week.label}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 30}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[10px]"
                >
                  計{formatHoursShort(total)}h
                </text>
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 42}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[9px]"
                >
                  平均{formatHoursShort(week.averagePerDay)}h/日
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function MonthCompare({
  thisMonth,
  lastMonth,
}: {
  thisMonth: StatsSummary["thisMonth"];
  lastMonth: StatsSummary["lastMonthSamePeriod"];
}) {
  const delta = thisMonth.breakdown.total - lastMonth.breakdown.total;
  const avgDelta = thisMonth.averagePerDay - lastMonth.averagePerDay;
  const maxTotal = Math.max(
    thisMonth.breakdown.total,
    lastMonth.breakdown.total,
    60,
  );
  const barHeight = 100;
  const pairs = [
    { label: "先月", stat: lastMonth, highlight: false },
    { label: "今月", stat: thisMonth, highlight: true },
  ];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-bold">今月 vs 先月（同じ日数で比較）</h3>
      <p className="mb-3 mt-0.5 text-xs text-zinc-500">
        例：今日が20日なら、先月の1〜20日と今月の1〜20日を比べます。
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {pairs.map(({ label, stat, highlight }) => (
          <div
            key={label}
            className={`rounded-xl p-3 ${
              highlight
                ? "bg-violet-50 dark:bg-violet-950/40"
                : "bg-zinc-50 dark:bg-zinc-800/50"
            }`}
          >
            <p
              className={`text-xs font-medium ${
                highlight ? "text-violet-600 dark:text-violet-400" : "text-zinc-500"
              }`}
            >
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMinutesDecimal(stat.breakdown.total)}
            </p>
            <p className="text-xs text-zinc-500">
              1日平均 {formatMinutes(stat.averagePerDay)}
            </p>
          </div>
        ))}
      </div>

      <DeltaBadge delta={delta} compareLabel="合計は先月より" />
      <div className="mt-1">
        <DeltaBadge delta={avgDelta} compareLabel="1日平均は先月より" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox="0 0 140 130"
          className="mx-auto block w-full max-w-[200px]"
          role="img"
          aria-label="今月と先月の学習時間比較"
        >
          {pairs.map(({ label, stat, highlight }, i) => {
            const x = i * 72 + 8;
            return (
              <g key={label}>
                <StackedBar
                  breakdown={stat.breakdown}
                  maxTotal={maxTotal}
                  barHeight={barHeight}
                  barWidth={56}
                  x={x}
                  highlight={highlight}
                />
                <text
                  x={x + 28}
                  y={barHeight + 16}
                  textAnchor="middle"
                  className={`text-xs ${
                    highlight
                      ? "fill-violet-600 font-bold dark:fill-violet-400"
                      : "fill-zinc-500"
                  }`}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3">
        <Legend />
      </div>
    </section>
  );
}

export function StatsPanel(summary: Props) {
  return (
    <div className="space-y-5">
      <HeroSummary summary={summary} />
      <DailyStackedChart days={summary.dailyLast7} />
      <WeekTrendChart weeks={summary.weeklyTrend} />
      <MonthCompare
        thisMonth={summary.thisMonth}
        lastMonth={summary.lastMonthSamePeriod}
      />
    </div>
  );
}

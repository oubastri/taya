"use client";

import type { Stats } from "@/hooks/use-workouts";

type Props = {
  stats: Stats;
  rhythmScore: number;
};

export function StatsView({ stats, rhythmScore }: Props) {
  return (
    <div className="flex flex-col items-end gap-1.5 text-right">
      <p className="whitespace-nowrap text-xl font-normal text-black">
        {stats.total} total moves.
      </p>
      <p className="whitespace-nowrap text-xl font-normal text-black">
        {stats.thisYear} this year.
      </p>
      <p className="whitespace-nowrap text-xl font-normal text-black">
        {stats.thisMonth} this month.
      </p>
      <p className="whitespace-nowrap text-xl font-normal text-black">
        {stats.thisWeek} this week.
      </p>
      <p className="whitespace-nowrap text-xl font-normal text-accent">
        {rhythmScore}% rhythm score.
      </p>
    </div>
  );
}

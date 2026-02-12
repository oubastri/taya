"use client";

import type { Stats } from "@/hooks/use-workouts";

type Props = { stats: Stats };

const green = "#11EB0E";
const black = "#000000";

export function StatsBlock({ stats }: Props) {
  return (
    <div
      className="mx-auto max-w-[254px] font-sans text-center font-normal md:max-w-none"
      style={{
        color: black,
        fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
        fontStyle: "normal",
        fontWeight: 400,
        fontSize: "clamp(24px, 4vw, 40px)",
        lineHeight: 1.15,
        letterSpacing: "-0.04em",
      }}
    >
      <p style={{ margin: 0 }}>
        <span style={{ color: green }}>{stats.total}</span> total moves.
      </p>
      <p style={{ margin: 0, marginTop: "0.15em" }}>
        <span style={{ color: green }}>{stats.thisYear}</span> this year.{" "}
        <span style={{ color: green }}>{stats.thisMonth}</span> this month.{" "}
        <span style={{ color: green }}>{stats.thisWeek}</span> this week.
      </p>
    </div>
  );
}

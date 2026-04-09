import { type Workout, localNoonFromDateKey, toDateKey } from "@/types/workout";

function getWeekKey(dateStr: string): string {
  const d = localNoonFromDateKey(dateStr);
  const day = d.getDay();
  const toMon = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - toMon);
  return toDateKey(d);
}

/** Returns map of workout id -> { week ordinal, month ordinal } for a single user's workouts. */
export function getOrdinalsForWorkouts(
  workouts: Workout[]
): Map<string, { week: number; month: number }> {
  const map = new Map<string, { week: number; month: number }>();
  const sorted = [...workouts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );
  for (const item of sorted) {
    const weekKey = getWeekKey(item.date);
    const monthKey = item.date.slice(0, 7);
    const weekItems = sorted.filter((i) => getWeekKey(i.date) === weekKey);
    const weekOrdinal = weekItems.filter(
      (i) =>
        i.date < item.date ||
        (i.date === item.date && i.createdAt <= item.createdAt)
    ).length;
    const monthItems = sorted.filter((i) => i.date.slice(0, 7) === monthKey);
    const monthOrdinal = monthItems.filter(
      (i) =>
        i.date < item.date ||
        (i.date === item.date && i.createdAt <= item.createdAt)
    ).length;
    map.set(item.id, { week: weekOrdinal, month: monthOrdinal });
  }
  return map;
}

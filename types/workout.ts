export type Workout = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: string; // ISO
};

/** Get YYYY-MM-DD for a Date */
export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse YYYY-MM-DD to Date at start of day (local) */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

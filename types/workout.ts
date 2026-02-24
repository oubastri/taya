export type ActivityType =
  | 'run'
  | 'walk'
  | 'cycle'
  | 'swim'
  | 'yoga'
  | 'lift'
  | 'hiit'
  | 'pilates'
  | 'basketball'
  | 'tennis'
  | 'soccer'
  | 'climb'
  | 'surf'
  | 'hike'
  | 'other';

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Running',
  walk: 'Walking',
  cycle: 'Cycling',
  swim: 'Swimming',
  yoga: 'Yoga',
  lift: 'Lifting',
  hiit: 'HIIT',
  pilates: 'Pilates',
  basketball: 'Basketball',
  tennis: 'Tennis',
  soccer: 'Soccer',
  climb: 'Climbing',
  surf: 'Surfing',
  hike: 'Hiking',
  other: 'Other',
};

/** Verb for feed sentence: "[Name] [verb] [activity]" e.g. "went running", "did yoga", "played basketball" */
export const ACTIVITY_VERB: Record<ActivityType, string> = {
  run: 'went',
  walk: 'went',
  cycle: 'went',
  swim: 'went',
  yoga: 'did',
  lift: 'did',
  hiit: 'did',
  pilates: 'did',
  basketball: 'played',
  tennis: 'played',
  soccer: 'played',
  climb: 'went',
  surf: 'went',
  hike: 'went',
  other: 'did',
};

export const ACTIVITY_TYPES: ActivityType[] = [
  'run', 'walk', 'cycle', 'swim', 'yoga',
  'lift', 'hiit', 'pilates', 'basketball', 'tennis',
  'soccer', 'climb', 'surf', 'hike', 'other',
];

export type Workout = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: string; // ISO
  activityType?: ActivityType;
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

export type ActivityType =
  | 'run'
  | 'walk'
  | 'cycle'
  | 'swim'
  | 'yoga'
  | 'lift'
  | 'hiit'
  | 'crossfit'
  | 'pilates'
  | 'basketball'
  | 'tennis'
  | 'soccer'
  | 'climb'
  | 'surf'
  | 'hike'
  | 'boxing'
  | 'dance'
  | 'golf'
  | 'martial_arts'
  | 'pickleball'
  | 'rowing'
  | 'ski'
  | 'spin'
  | 'stretch'
  | 'volleyball'
  | 'other';

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Running',
  walk: 'Walking',
  cycle: 'Cycling',
  swim: 'Swimming',
  yoga: 'Yoga',
  lift: 'Lifting',
  hiit: 'HIIT',
  crossfit: 'CrossFit',
  pilates: 'Pilates',
  basketball: 'Basketball',
  tennis: 'Tennis',
  soccer: 'Soccer',
  climb: 'Climbing',
  surf: 'Surfing',
  hike: 'Hiking',
  boxing: 'Boxing',
  dance: 'Dance',
  golf: 'Golf',
  martial_arts: 'Martial Arts',
  pickleball: 'Pickleball',
  rowing: 'Rowing',
  ski: 'Skiing',
  spin: 'Spin',
  stretch: 'Stretch',
  volleyball: 'Volleyball',
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
  crossfit: 'did',
  pilates: 'did',
  basketball: 'played',
  tennis: 'played',
  soccer: 'played',
  climb: 'went',
  surf: 'went',
  hike: 'went',
  boxing: 'did',
  dance: 'did',
  golf: 'played',
  martial_arts: 'did',
  pickleball: 'played',
  rowing: 'went',
  ski: 'went',
  spin: 'did',
  stretch: 'did',
  volleyball: 'played',
  other: 'did',
};

/** Full phrase for feed: "@handle [phrase] today at 7:30pm." e.g. "did yoga", "played golf", "went for a run" */
export const ACTIVITY_FEED_PHRASE: Record<ActivityType, string> = {
  run: 'went for a run',
  walk: 'went for a walk',
  cycle: 'went cycling',
  swim: 'went swimming',
  yoga: 'did yoga',
  lift: 'did some lifting',
  hiit: 'did HIIT',
  crossfit: 'did CrossFit',
  pilates: 'did Pilates',
  basketball: 'played basketball',
  tennis: 'played tennis',
  soccer: 'played soccer',
  climb: 'went climbing',
  surf: 'went surfing',
  hike: 'went hiking',
  boxing: 'did boxing',
  dance: 'went dancing',
  golf: 'played golf',
  martial_arts: 'did martial arts',
  pickleball: 'played pickleball',
  rowing: 'went rowing',
  ski: 'went skiing',
  spin: 'did spin',
  stretch: 'did some stretching',
  volleyball: 'played volleyball',
  other: 'did something',
};

/** The activity word(s) to highlight in blue in the feed sentence (rest of phrase stays black) */
export const ACTIVITY_FEED_HIGHLIGHT: Record<ActivityType, string> = {
  run: 'run',
  walk: 'walk',
  cycle: 'cycling',
  swim: 'swimming',
  yoga: 'yoga',
  lift: 'lifting',
  hiit: 'HIIT',
  crossfit: 'CrossFit',
  pilates: 'Pilates',
  basketball: 'basketball',
  tennis: 'tennis',
  soccer: 'soccer',
  climb: 'climbing',
  surf: 'surfing',
  hike: 'hiking',
  boxing: 'boxing',
  dance: 'dancing',
  golf: 'golf',
  martial_arts: 'martial arts',
  pickleball: 'pickleball',
  rowing: 'rowing',
  ski: 'skiing',
  spin: 'spin',
  stretch: 'stretching',
  volleyball: 'volleyball',
  other: 'something',
};

export const ACTIVITY_TYPES: ActivityType[] = [
  'run', 'walk', 'cycle', 'swim', 'yoga',
  'lift', 'hiit', 'crossfit', 'pilates',
  'basketball', 'tennis', 'soccer', 'volleyball', 'pickleball', 'golf',
  'climb', 'surf', 'hike', 'ski', 'rowing',
  'boxing', 'martial_arts', 'dance', 'stretch', 'spin',
  'other',
];

/** Grouped for the log-move activity picker: run/walk/hike together, etc. */
export const ACTIVITY_GROUPS: { activities: ActivityType[] }[] = [
  { activities: ['run', 'walk', 'hike'] },
  { activities: ['cycle', 'spin', 'rowing'] },
  { activities: ['swim', 'surf'] },
  { activities: ['yoga', 'pilates', 'stretch', 'dance'] },
  { activities: ['lift', 'hiit', 'crossfit'] },
  { activities: ['basketball', 'tennis', 'soccer', 'volleyball', 'pickleball', 'golf'] },
  { activities: ['boxing', 'martial_arts'] },
  { activities: ['climb', 'ski'] },
  { activities: ['other'] },
];

export type Workout = {
  id: string;
  /**
   * Civil calendar day when the member logged the move (YYYY-MM-DD).
   * Always chosen in the member's device timezone when they log; stored as plain text (not shifted by UTC or server TZ).
   */
  date: string;
  description: string;
  createdAt: string; // ISO
  activityType?: ActivityType;
};

/**
 * YYYY-MM-DD for a `Date` in the environment's local calendar (`Date` in the browser = viewer's / member's device TZ).
 * Use this for "today", calendar cells, and any `Date` the user would recognize on their device.
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD to Date at local midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Local noon on that calendar day. Prefer over ISO strings like `YYYY-MM-DDT12:00:00` so parsing is unambiguously local.
 * Noon avoids DST edge cases when deriving weekdays or comparing ranges.
 */
export function localNoonFromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Add whole calendar days to a YYYY-MM-DD in local time. */
export function offsetDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateKey(dt);
}

/**
 * Day label for profile Moves list: `FEB 13` (en-US short month, uppercase, no leading zero on day).
 */
export function formatProfileMovesListDayLabel(dateKey: string): string {
  const d = localNoonFromDateKey(dateKey);
  const mon = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${mon} ${d.getDate()}`;
}

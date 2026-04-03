/** Dispatched when workout data changes (mock or Supabase). */
export const WORKOUTS_CHANGED_EVENT = "taya:workouts-changed";

export type WorkoutsChangedDetail = {
  source: "add" | "delete" | "update" | "local";
  /** Present for add / delete / update from the logged-in user. */
  workoutId?: string;
};

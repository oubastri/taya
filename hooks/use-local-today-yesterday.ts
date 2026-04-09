"use client";

import { useEffect, useState } from "react";
import { offsetDateKey, toDateKey } from "@/types/workout";

/**
 * "Today" / "Yesterday" in the user's local calendar, updating at local midnight and when the tab becomes visible
 * (e.g. after traveling or crossing midnight with the app backgrounded).
 */
export function useLocalTodayYesterday(): { today: string; yesterday: string } {
  const [today, setToday] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    const sync = () => setToday(toDateKey(new Date()));

    let timeoutId: number;
    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const ms = Math.max(1, nextMidnight.getTime() - now.getTime());
      timeoutId = window.setTimeout(() => {
        sync();
        scheduleMidnight();
      }, ms);
    };
    scheduleMidnight();

    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { today, yesterday: offsetDateKey(today, -1) };
}

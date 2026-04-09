"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLogSheet } from "@/contexts/log-sheet";
import { useWorkouts } from "@/hooks/use-workouts";
import { ActivityIcon } from "./ActivityIcon";
import { ProfileCalendar } from "./ProfileCalendar";
import {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  fromDateKey,
  toDateKey,
} from "@/types/workout";
import type { ActivityType } from "@/types/workout";
import {
  SHEET_DISMISS_DRAG_PX,
  SHEET_DRAG_REGION_STYLE,
  SHEET_EXIT_MS,
  SHEET_SPRING,
  SHEET_TRANSFORM_SETTLED_CENTERED,
} from "@/lib/sheetMotion";
import { LOG_SHEET_SAVE_HANDOFF_MS } from "@/lib/feedEntranceMotion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { sheetHeroTitle } from "@/lib/sheetTitleStyle";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const LOG_SHEET_CHIPS_ID = "log-sheet-chips";

function isTextFieldTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest("input, textarea");
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (!(el instanceof HTMLInputElement)) return true;
  const t = el.type.toLowerCase();
  return !["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(
    t
  );
}

type LogSheetPan = {
  pointerId: number;
  startX: number;
  startY: number;
  downTarget: EventTarget;
  phase: "deciding" | "sheet" | "rejected";
};

const DEFAULT_TOP_5: ActivityType[] = [
  "run",
  "walk",
  "cycle",
  "yoga",
  "lift",
];

const MAX_DESCRIPTION_LENGTH = 150;
/** Cross-fade + slide between log form and inline date picker */
const LOG_VIEW_TRANSITION = `0.36s cubic-bezier(0.32, 0.72, 0, 1)`;
/** "View more" expand — matches sheet motion feel */
const LOG_CHIP_EXPAND_EASE = [0.32, 0.72, 0, 1] as const;
const CLOSE_BTN = 54;
/** Matches `MOBILE_MENU_MQ` in AccountMenu — tall, keyboard-friendly sheet on phone-sized viewports. */
const LOG_SHEET_COMPACT_MQ = "(max-width: 599px)";

/** Matches `fieldErrorText` in settings sheets (e.g. ChangePasswordSheet) */
const logSheetFieldError: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#ff3b30",
  lineHeight: 1.35,
};

function formatSheetDate(dateKey: string): string {
  const today = toDateKey(new Date());
  if (dateKey === today) return "TODAY";
  const d = fromDateKey(dateKey);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  return `${weekday} ${month} ${day}`;
}

function getTop5(workouts: { activityType?: ActivityType }[]): ActivityType[] {
  if (workouts.length === 0) return [...DEFAULT_TOP_5];
  const count = new Map<ActivityType, number>();
  for (const w of workouts) {
    const t = (w.activityType ?? "other") as ActivityType;
    count.set(t, (count.get(t) ?? 0) + 1);
  }
  const sorted = Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([a]) => a);
  const top5: ActivityType[] = [];
  for (const a of sorted) {
    if (top5.length >= 5) break;
    top5.push(a);
  }
  for (const a of DEFAULT_TOP_5) {
    if (top5.length >= 5) break;
    if (!top5.includes(a)) top5.push(a);
  }
  return top5;
}

function getOrderedActivities(
  workouts: { activityType?: ActivityType }[]
): ActivityType[] {
  const top5 = getTop5(workouts);
  const rest = ACTIVITY_TYPES.filter((a) => !top5.includes(a));
  return [...top5, ...rest];
}

/** Pixels of layout viewport extending below the visual viewport (browser chrome, etc.). */
function getVisualViewportBottomOverlapPx(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  const innerBottomGap = window.innerHeight - vv.height - vv.offsetTop;
  const clientH = document.documentElement?.clientHeight ?? window.innerHeight;
  const clientBottomGap = clientH - vv.height - vv.offsetTop;
  return Math.max(0, innerBottomGap, clientBottomGap);
}

export function LogSheet() {
  const { isOpen, close, initialDateKey, workoutToEdit } = useLogSheet();
  const { workouts, addWorkout, updateWorkout } = useWorkouts();

  /** Slide/scrim animation (SearchSheet-style); `isOpen` stays true until exit finishes. */
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [showAll, setShowAll] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => toDateKey(new Date()));
  const [datePickerFutureErr, setDatePickerFutureErr] = useState<string | null>(
    null
  );
  const datePickerSnapshotRef = useRef<string>("");

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dy: 0 });
  const sheetPanRef = useRef<LogSheetPan | null>(null);
  const endSheetDragRef = useRef<() => void>(() => {});
  const chipsRef = useRef<HTMLDivElement>(null);
  const chipsInnerRef = useRef<HTMLDivElement>(null);
  const logSheetBodyScrollRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [browserOvhPx, setBrowserOvhPx] = useState(0);
  /** `visualViewport.height / 100` in px — drives min/max height so the sheet tracks visible viewport. */
  const [visualVhPx, setVisualVhPx] = useState(0);
  /** Phone layout: sheet uses ~full visual height so the CTA sits on the keyboard edge. */
  const [compactSheet, setCompactSheet] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(LOG_SHEET_COMPACT_MQ).matches
      : false
  );
  /** Visual viewport shrunk (virtual keyboard / browser UI) — tone down home-indicator padding on footer. */
  const [keyboardLikelyOpen, setKeyboardLikelyOpen] = useState(false);
  const chipsDragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    rafId: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      if (!vv) {
        setBrowserOvhPx(0);
        setVisualVhPx(window.innerHeight / 100);
        setKeyboardLikelyOpen(false);
        root.style.removeProperty("--log-sheet-browser-ovh");
        root.style.removeProperty("--log-sheet-vvh");
        return;
      }
      const px = getVisualViewportBottomOverlapPx();
      const vvh = vv.height / 100;
      setBrowserOvhPx(px);
      setVisualVhPx(vvh);
      setKeyboardLikelyOpen(vv.height < window.innerHeight * 0.88);
      root.style.setProperty("--log-sheet-browser-ovh", `${px}px`);
      root.style.setProperty("--log-sheet-vvh", `${vvh}px`);
    };
    update();
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    window.addEventListener("resize", update);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
      root.style.removeProperty("--log-sheet-browser-ovh");
      root.style.removeProperty("--log-sheet-vvh");
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !panelOpen || typeof window === "undefined") return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    let cancelled = false;
    let raf2 = 0;
    const refresh = () => {
      if (cancelled || !vv) return;
      const px = getVisualViewportBottomOverlapPx();
      const vvh = vv.height / 100;
      setBrowserOvhPx(px);
      setVisualVhPx(vvh);
      setKeyboardLikelyOpen(vv.height < window.innerHeight * 0.88);
      root.style.setProperty("--log-sheet-browser-ovh", `${px}px`);
      root.style.setProperty("--log-sheet-vvh", `${vvh}px`);
    };
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(refresh);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, panelOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(LOG_SHEET_COMPACT_MQ);
    const sync = () => setCompactSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const scrollNoteIntoView = useCallback(() => {
    const scrollEl = logSheetBodyScrollRef.current;
    const ta = noteRef.current;
    if (!scrollEl || !ta) return;
    const pad = 12;
    const s = scrollEl.getBoundingClientRect();
    const t = ta.getBoundingClientRect();
    if (t.bottom > s.bottom - pad) {
      scrollEl.scrollTop += t.bottom - s.bottom + pad;
    }
    if (t.top < s.top + pad) {
      scrollEl.scrollTop -= s.top + pad - t.top;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !panelOpen || typeof window === "undefined") return;
    const vv = window.visualViewport;
    const onVvChange = () => {
      if (document.activeElement === noteRef.current) scrollNoteIntoView();
    };
    if (vv) {
      vv.addEventListener("resize", onVvChange);
      vv.addEventListener("scroll", onVvChange);
    }
    return () => {
      if (vv) {
        vv.removeEventListener("resize", onVvChange);
        vv.removeEventListener("scroll", onVvChange);
      }
    };
  }, [isOpen, panelOpen, scrollNoteIntoView]);

  useEffect(() => {
    const el = chipsRef.current;
    const inner = chipsInnerRef.current;
    if (!el || !inner) return;
    const safeInner: HTMLElement = inner;
    const drag = chipsDragRef.current;

    // Rolling velocity sample buffer — last 100ms of pointer events
    const velSamples: { x: number; t: number }[] = [];

    let overscroll = 0;
    let springRafId = 0;

    // c=0.55 matches the iOS rubber-band coefficient; dim=240 gives progressive
    // resistance that tracks closely at first then gently stiffens — not a hard wall
    function rubberBand(x: number): number {
      const c = 0.55;
      const dim = 240;
      return (dim * c * x) / (dim * c + x);
    }

    function setTranslate(px: number) {
      overscroll = px;
      safeInner.style.transform = px === 0 ? "" : `translateX(${px}px)`;
    }

    // Exponential decay settling in ~300ms — matches iOS edge-bounce duration
    function springBack() {
      cancelAnimationFrame(springRafId);
      const animate = () => {
        overscroll *= 0.80;
        if (Math.abs(overscroll) < 0.2) {
          safeInner.style.transform = "";
          overscroll = 0;
          return;
        }
        safeInner.style.transform = `translateX(${overscroll}px)`;
        springRafId = requestAnimationFrame(animate);
      };
      springRafId = requestAnimationFrame(animate);
    }

    function getFlickVelocity(): number {
      const now = performance.now();
      // Use samples from the last 100ms for a stable, noise-free velocity
      const recent = velSamples.filter((s) => now - s.t < 100);
      if (recent.length < 2) return 0;
      const oldest = recent[0];
      const newest = recent[recent.length - 1];
      const dt = newest.t - oldest.t;
      return dt > 0 ? (oldest.x - newest.x) / dt : 0;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      cancelAnimationFrame(drag.rafId);
      cancelAnimationFrame(springRafId);
      overscroll = 0;
      safeInner.style.transform = "";
      velSamples.length = 0;
      drag.active = true;
      drag.moved = false;
      drag.startX = e.clientX;
      drag.lastX = e.clientX;
      drag.lastTime = performance.now();
      drag.velocity = 0;
      drag.scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      document.body.style.cursor = "grabbing";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 5) drag.moved = true;
      if (!drag.moved) return;

      const now = performance.now();
      velSamples.push({ x: e.clientX, t: now });
      // Keep buffer lean — only last 20 samples needed
      if (velSamples.length > 20) velSamples.shift();

      const maxScroll = el.scrollWidth - el.clientWidth;
      const raw = drag.scrollLeft - dx;
      if (raw < 0) {
        el.scrollLeft = 0;
        setTranslate(rubberBand(-raw));
      } else if (raw > maxScroll) {
        el.scrollLeft = maxScroll;
        setTranslate(-rubberBand(raw - maxScroll));
      } else {
        el.scrollLeft = raw;
        setTranslate(0);
      }
    };

    const onPointerUp = () => {
      if (!drag.active) return;
      drag.active = false;
      el.style.cursor = "grab";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (overscroll !== 0) {
        springBack();
        return;
      }

      const flickV = getFlickVelocity();
      if (Math.abs(flickV) < 0.05) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      // Clamp initial velocity so extreme flicks don't feel uncontrolled
      let v = Math.max(-30, Math.min(30, flickV * 16));
      const step = () => {
        if (Math.abs(v) < 0.4) return;
        const next = el.scrollLeft + v;
        if (next <= 0 || next >= maxScroll) {
          el.scrollLeft = Math.max(0, Math.min(maxScroll, next));
          return;
        }
        el.scrollLeft = next;
        v *= 0.93;
        drag.rafId = requestAnimationFrame(step);
      };
      drag.rafId = requestAnimationFrame(step);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (drag.moved) {
        e.stopPropagation();
        e.preventDefault();
        drag.moved = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      cancelAnimationFrame(drag.rafId);
      cancelAnimationFrame(springRafId);
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  const orderedActivities = useMemo(
    () => getOrderedActivities(workouts),
    [workouts]
  );
  const top5 = useMemo(() => orderedActivities.slice(0, 5), [orderedActivities]);
  const remaining = useMemo(() => orderedActivities.slice(5), [orderedActivities]);
  const reduceMotion = useReducedMotion();
  const visibleActivities = showAll ? orderedActivities : top5;

  useEffect(() => {
    if (!isOpen) return;
    if (workoutToEdit) {
      setDate(workoutToEdit.date);
      setDraftDate(workoutToEdit.date);
      setDescription(workoutToEdit.description ?? "");
      setSelected((workoutToEdit.activityType ?? "other") as ActivityType);
    } else {
      const d = initialDateKey ?? toDateKey(new Date());
      setDate(d);
      setDraftDate(d);
      setDescription("");
      setSelected(null);
    }
  }, [isOpen, initialDateKey, workoutToEdit]);

  useEffect(() => {
    if (!isOpen) {
      setPanelOpen(false);
      return;
    }
    setPanelOpen(false);
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setPanelOpen(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, [isOpen]);

  useLockBodyScroll(isOpen);

  const openInlineDatePicker = useCallback(() => {
    datePickerSnapshotRef.current = date;
    setDraftDate(date);
    setDatePickerFutureErr(null);
    setDatePickerOpen(true);
  }, [date]);

  const cancelInlineDatePicker = useCallback(() => {
    setDate(datePickerSnapshotRef.current);
    setDatePickerFutureErr(null);
    setDatePickerOpen(false);
  }, []);

  useEffect(() => {
    if (!datePickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelInlineDatePicker();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [datePickerOpen, cancelInlineDatePicker]);

  const reset = useCallback(() => {
    setSelected(null);
    setDescription("");
    setShowAll(false);
    setDatePickerOpen(false);
    setDatePickerFutureErr(null);
  }, []);

  useEffect(() => {
    if (!datePickerFutureErr) return;
    const t = window.setTimeout(() => setDatePickerFutureErr(null), 4000);
    return () => window.clearTimeout(t);
  }, [datePickerFutureErr]);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
    window.setTimeout(() => {
      close();
      window.setTimeout(reset, 50);
    }, SHEET_EXIT_MS);
  }, [close, reset]);

  const handleSubmit = () => {
    if (!selected) return;
    if (workoutToEdit) {
      updateWorkout(workoutToEdit.id, {
        date,
        description: description.trim(),
        activityType: selected,
      });
      handleClose();
    } else {
      handleClose();
      window.setTimeout(() => {
        addWorkout(date, description.trim(), selected);
      }, LOG_SHEET_SAVE_HANDOFF_MS);
    }
  };


  const endVerticalSheetDrag = useCallback(() => {
    const { dy } = dragRef.current;

    if (dy > SHEET_DISMISS_DRAG_PX) {
      const vh = window.innerHeight;
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = `translateX(-50%) translateY(${vh}px)`;
      }
      if (scrimRef.current) {
        scrimRef.current.style.transition = `opacity ${SHEET_SPRING}`;
        scrimRef.current.style.opacity = "0";
      }
      window.setTimeout(() => {
        close();
        window.setTimeout(reset, 50);
      }, SHEET_EXIT_MS);
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${SHEET_SPRING}`;
        sheetRef.current.style.transform = "translateX(-50%) translateY(0)";
        window.setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
            sheetRef.current.style.transform = SHEET_TRANSFORM_SETTLED_CENTERED;
          }
        }, SHEET_EXIT_MS);
      }
    }
    dragRef.current.dy = 0;
  }, [close, reset]);

  endSheetDragRef.current = endVerticalSheetDrag;

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isOpen || !panelOpen) return;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target;
      if (!(t instanceof Element) || !sheet.contains(t)) return;
      if (t.closest("[data-log-sheet-close]")) return;
      if (isTextFieldTarget(t)) return;

      sheetPanRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        downTarget: t,
        phase: "deciding",
      };
    };

    const onMove = (e: PointerEvent) => {
      const st = sheetPanRef.current;
      if (!st || st.pointerId !== e.pointerId) return;
      if (st.phase === "rejected") return;

      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      const downEl = st.downTarget instanceof Element ? st.downTarget : null;
      if (!downEl) return;

      if (st.phase === "deciding") {
        const inChips = chipsRef.current?.contains(downEl) ?? false;
        if (inChips) {
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
            st.phase = "rejected";
            return;
          }
          if (dy > 10 && dy >= Math.abs(dx)) {
            st.phase = "sheet";
            e.preventDefault();
            sheet.setPointerCapture(e.pointerId);
            sheet.style.transition = "none";
          }
          return;
        }

        if (datePickerOpen) {
          const cs = calendarScrollRef.current;
          if (cs?.contains(downEl)) {
            if (cs.scrollTop > 0) {
              if (Math.abs(dy) > 6) st.phase = "rejected";
              return;
            }
            if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
              st.phase = "rejected";
              return;
            }
            if (dy > 10 && dy >= Math.abs(dx)) {
              st.phase = "sheet";
              e.preventDefault();
              sheet.setPointerCapture(e.pointerId);
              sheet.style.transition = "none";
            }
            return;
          }
        }

        if (dy > 10 && dy >= Math.abs(dx)) {
          st.phase = "sheet";
          e.preventDefault();
          sheet.setPointerCapture(e.pointerId);
          sheet.style.transition = "none";
        }
        return;
      }

      if (st.phase === "sheet") {
        e.preventDefault();
        const pullDy = Math.max(0, e.clientY - st.startY);
        dragRef.current.dy = pullDy;
        sheet.style.transform = `translateX(-50%) translateY(${pullDy}px)`;
      }
    };

    const onUp = (e: PointerEvent) => {
      const st = sheetPanRef.current;
      if (!st || st.pointerId !== e.pointerId) return;
      if (st.phase === "sheet") {
        try {
          sheet.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        endSheetDragRef.current();
      }
      sheetPanRef.current = null;
    };

    sheet.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      sheet.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      sheetPanRef.current = null;
    };
  }, [isOpen, panelOpen, datePickerOpen]);

  const isEditing = !!workoutToEdit;

  const sheetMainSize = useMemo(() => {
    if (compactSheet) {
      if (visualVhPx > 0) {
        const cap = `calc(${100 * visualVhPx}px - env(safe-area-inset-bottom, 0px) - 6px)`;
        return { minHeight: cap, maxHeight: cap };
      }
      return {
        minHeight:
          "calc(100dvh - env(safe-area-inset-bottom, 0px) - 6px)",
        maxHeight:
          "calc(100dvh - env(safe-area-inset-bottom, 0px) - 6px)",
      };
    }
    if (visualVhPx > 0) {
      return {
        minHeight: `min(${54 * visualVhPx}px, calc(${100 * visualVhPx}px - env(safe-area-inset-bottom, 0px) - 8px))`,
        maxHeight: `min(${74 * visualVhPx}px, calc(${100 * visualVhPx}px - env(safe-area-inset-bottom, 0px) - 8px))`,
      };
    }
    return {
      minHeight:
        "min(54svh, calc(100dvh - env(safe-area-inset-bottom, 0px) - 8px))",
      maxHeight:
        "min(74svh, calc(100dvh - env(safe-area-inset-bottom, 0px) - 8px))",
    };
  }, [compactSheet, visualVhPx]);

  return (
    <>
      <style>{`
        #${LOG_SHEET_CHIPS_ID}::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Scrim */}
      <div
        ref={scrimRef}
        onClick={handleClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "var(--overlay)",
          opacity: panelOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: `opacity ${SHEET_SPRING}`,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          datePickerOpen
            ? "Select workout date"
            : isEditing
              ? "Edit workout"
              : "Log a workout"
        }
        style={{
          position: "fixed",
          /* Sit on the visual viewport bottom (above virtual keyboard / browser chrome). */
          bottom: browserOvhPx,
          left: "50%",
          width: "100%",
          maxWidth: 428,
          zIndex: 101,
          background: "var(--sheet-bg)",
          borderRadius: "32px 32px 0 0",
          boxShadow: "var(--sheet-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          /* Without a main-size floor, `flex:1` on the body (only abs children) collapses to ~0 */
          ...sheetMainSize,
          transform: panelOpen
            ? "translateX(-50%)"
            : "translateX(-50%) translateY(100%)",
          transition: `transform ${SHEET_SPRING}`,
          pointerEvents: isOpen ? "auto" : "none",
          overscrollBehavior: "contain",
        }}
      >
        {/* Drag handle (visual); dismiss gesture is handled on the whole sheet. */}
        <div style={SHEET_DRAG_REGION_STYLE} aria-hidden>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--drag-handle)",
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          data-log-sheet-close
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            width: CLOSE_BTN,
            height: CLOSE_BTN,
            borderRadius: "100px",
            background: "var(--close-btn-bg)",
            border: "1px solid var(--close-btn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--close-btn-icon)"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Date chip toggles inline calendar (same sheet); top inset matches close (16) */}
        <div
          style={{
            paddingTop: 0,
            paddingLeft: 16,
            paddingRight: 16 + CLOSE_BTN + 10,
          }}
        >
          <button
            type="button"
            onClick={() =>
              datePickerOpen ? cancelInlineDatePicker() : openInlineDatePicker()
            }
            aria-expanded={datePickerOpen}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 100,
              border: "none",
              background: "var(--chip-bg)",
              cursor: "pointer",
              fontFamily: '"B612 Mono", ui-monospace, monospace',
              fontSize: 12,
              fontWeight: 500,
              color: "var(--chip-color)",
              letterSpacing: "-0.48px",
              WebkitTapHighlightColor: "transparent",
              lineHeight: "normal",
              transition: "background 0.18s, color 0.18s",
            }}
            className="active:opacity-90"
          >
            {formatSheetDate(datePickerOpen ? draftDate : date)}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{
                opacity: 0.85,
                transition: "transform 0.22s ease",
                transform: datePickerOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <h2
            style={{
              ...sheetHeroTitle,
              marginTop: 28,
            }}
          >
            {datePickerOpen ? "Select date" : "What did you do?"}
          </h2>
          {datePickerOpen && datePickerFutureErr ? (
            <p role="alert" style={{ ...logSheetFieldError, marginTop: 8 }}>
              {datePickerFutureErr}
            </p>
          ) : null}
        </div>

        {/* Fills space below the header within maxHeight; abs layers for log vs calendar. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Log form — fades out when picking a date */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              opacity: datePickerOpen ? 0 : 1,
              transition: `opacity ${LOG_VIEW_TRANSITION}`,
              pointerEvents: datePickerOpen ? "none" : "auto",
            }}
          >
        {/* Scroll when the keyboard shrinks the viewport so chips + note are not clipped. */}
        <div
          ref={logSheetBodyScrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
          }}
        >
        {/* Activity chips — horizontal scroll only */}
        <div
          id={LOG_SHEET_CHIPS_ID}
          ref={chipsRef}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            flexShrink: 0,
            touchAction: "pan-x",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <motion.div
            ref={chipsInnerRef}
            layout
            style={{
              display: "flex",
              gap: 8,
              padding: "26px 24px 10px 16px",
              width: "max-content",
              willChange: "transform",
            }}
            transition={
              reduceMotion
                ? { layout: { duration: 0 } }
                : {
                    layout: {
                      type: "spring",
                      stiffness: 380,
                      damping: 34,
                      mass: 0.85,
                    },
                  }
            }
          >
            {visibleActivities.map((activity, index) => {
              const isSelected = selected === activity;
              const isReveal = showAll && index >= 5;
              const stagger = Math.max(0, index - 5);
              return (
                <motion.button
                  key={activity}
                  layout
                  type="button"
                  onClick={() => setSelected(isSelected ? null : activity)}
                  aria-pressed={isSelected}
                  className={
                    isSelected ? "log-sheet-activity-chip--selected" : undefined
                  }
                  initial={
                    reduceMotion || !isReveal
                      ? false
                      : { opacity: 0, x: -14 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    layout: reduceMotion
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                          mass: 0.78,
                        },
                    opacity: reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.34,
                          ease: LOG_CHIP_EXPAND_EASE,
                          delay: stagger * 0.038,
                        },
                    x: reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.34,
                          ease: LOG_CHIP_EXPAND_EASE,
                          delay: stagger * 0.038,
                        },
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 14px 0 10px",
                    height: 40,
                    borderRadius: 100,
                    border: "none",
                    background: isSelected ? "var(--chip-selected-bg)" : "var(--chip-bg)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: isSelected ? "var(--chip-selected-color)" : "var(--chip-color)",
                    WebkitTapHighlightColor: "transparent",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ActivityIcon type={activity} size={22} invert={isSelected} />
                  {ACTIVITY_LABELS[activity]}
                </motion.button>
              );
            })}

            <AnimatePresence initial={false} mode="popLayout">
              {!showAll && remaining.length > 0 ? (
                <motion.button
                  key="log-sheet-view-more"
                  type="button"
                  layout
                  onClick={() => setShowAll(true)}
                  initial={false}
                  exit={
                    reduceMotion
                      ? { opacity: 0, transition: { duration: 0 } }
                      : {
                          opacity: 0,
                          scale: 0.94,
                          transition: {
                            duration: 0.22,
                            ease: LOG_CHIP_EXPAND_EASE,
                          },
                        }
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "0 14px",
                    height: 40,
                    borderRadius: 100,
                    border: "none",
                    background: "var(--chip-bg)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: "var(--chip-color)",
                    WebkitTapHighlightColor: "transparent",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  View more
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </motion.button>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>

        <div style={{ flexShrink: 0, padding: "12px 24px 0" }}>
          <textarea
            ref={noteRef}
            id="log-sheet-note"
            placeholder="Tell us about it (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
            }
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={5}
            onInput={(e) => {
              const el = e.currentTarget;
              if (el.selectionStart === el.value.length) {
                el.scrollTop = el.scrollHeight;
              }
            }}
            onFocus={() => {
              const run = () => scrollNoteIntoView();
              requestAnimationFrame(() => {
                requestAnimationFrame(run);
              });
              window.setTimeout(run, 120);
            }}
            style={{
              width: "100%",
              minHeight: 120,
              maxHeight:
                visualVhPx > 0
                  ? `${Math.min(220, 32 * visualVhPx)}px`
                  : "min(220px, 32svh)",
              boxSizing: "border-box",
              resize: "none",
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              fontWeight: 400,
              color: "var(--input-color)",
              letterSpacing: "-0.025em",
              lineHeight: 1.55,
              display: "block",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          />
        </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "10px 24px",
            paddingBottom: keyboardLikelyOpen
              ? 10
              : "max(8px, calc(8px + env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            className={`app-cta ${selected ? "" : "app-cta--inactive"}`}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 50,
              border: "none",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              cursor: selected ? "pointer" : "default",
              WebkitTapHighlightColor: "transparent",
              transition:
                "opacity 0.2s ease, background-color var(--duration-fast) var(--ease-out-expo), box-shadow var(--duration-fast) var(--ease-out-expo), transform var(--duration-fast) var(--ease-out-expo)",
              opacity: selected ? 1 : 0.3,
            }}
          >
            {isEditing ? "Save" : "Log move"}
          </button>
        </div>
          </div>

          {/* Inline calendar — fades in over the same region */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              opacity: datePickerOpen ? 1 : 0,
              transition: datePickerOpen
                ? `opacity ${LOG_VIEW_TRANSITION} 70ms`
                : `opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1)`,
              pointerEvents: datePickerOpen ? "auto" : "none",
            }}
          >
            <div
              ref={calendarScrollRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
                touchAction: "pan-y",
                padding: "22px 24px 4px",
                boxSizing: "border-box",
              }}
            >
              <ProfileCalendar
                workouts={[]}
                preventFutureDates
                onAttemptSelectFuture={() =>
                  setDatePickerFutureErr(
                    "You can only log workouts on or before today."
                  )
                }
                pickDate={(dk) => {
                  setDatePickerFutureErr(null);
                  setDraftDate(dk);
                  setDate(dk);
                  setDatePickerOpen(false);
                }}
                selectedDateKey={draftDate}
              />
            </div>
            <div
              style={{
                flexShrink: 0,
                padding: "12px 24px",
                paddingBottom:
                  "max(20px, calc(10px + env(safe-area-inset-bottom, 0px)))",
                boxSizing: "border-box",
              }}
            >
              <button
                type="button"
                onClick={cancelInlineDatePicker}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 50,
                  border: "1px solid var(--border-strong)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
                className="active:opacity-90"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

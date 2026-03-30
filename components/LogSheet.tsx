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
import { SHEET_EXIT_MS, SHEET_SPRING } from "@/lib/sheetMotion";
import { sheetHeroTitle } from "@/lib/sheetTitleStyle";

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
const CLOSE_BTN = 54;

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
  const dragRef = useRef({ active: false, startY: 0, dy: 0 });
  const chipsRef = useRef<HTMLDivElement>(null);
  const chipsInnerRef = useRef<HTMLDivElement>(null);
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
    } else {
      addWorkout(date, description.trim(), selected);
    }
    handleClose();
  };


  const onHandleDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.dy = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  };

  const onHandleUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const { dy } = dragRef.current;

    if (dy > 90) {
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
            sheetRef.current.style.transform = "";
          }
        }, SHEET_EXIT_MS);
      }
    }
  };

  const isEditing = !!workoutToEdit;

  return (
    <>
      <style>{`
        #log-sheet-chips::-webkit-scrollbar { display: none; }
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
          bottom: 0,
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
          maxHeight: datePickerOpen
            ? "min(94svh, calc(100dvh - 8px))"
            : "90svh",
          transform: panelOpen
            ? "translateX(-50%)"
            : "translateX(-50%) translateY(100%)",
          transition: `transform ${SHEET_SPRING}`,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
          padding: "12px 24px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          }}
        >
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

        {/* In-flow height comes from minHeight (children are position:absolute). Animate minHeight when the inline calendar opens. */}
        <div
          style={{
            flex: "0 0 auto",
            flexShrink: 0,
            minHeight: datePickerOpen
              ? "min(560px, calc(94svh - 230px))"
              : "min(300px, 44svh)",
            transition: `min-height ${LOG_VIEW_TRANSITION}`,
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
              opacity: datePickerOpen ? 0 : 1,
              transition: `opacity ${LOG_VIEW_TRANSITION}`,
              pointerEvents: datePickerOpen ? "none" : "auto",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                flexDirection: "column",
              }}
            >
        {/* Activity chips — horizontal scroll */}
        <div
          id="log-sheet-chips"
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
          <div
            ref={chipsInnerRef}
            style={{
              display: "flex",
              gap: 8,
              padding: "26px 24px 22px",
              width: "max-content",
              willChange: "transform",
            }}
          >
            {(showAll ? orderedActivities : top5).map((activity) => {
              const isSelected = selected === activity;
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : activity)}
                  aria-pressed={isSelected}
                  className={
                    isSelected ? "log-sheet-activity-chip--selected" : undefined
                  }
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
                    transition: "background 0.18s, color 0.18s",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ActivityIcon type={activity} size={22} invert={isSelected} />
                  {ACTIVITY_LABELS[activity]}
                </button>
              );
            })}

            {/* View more pill */}
            {!showAll && remaining.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
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
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div style={{ padding: "26px 24px 0" }}>
          <textarea
            id="log-sheet-note"
            placeholder="Tell us about it (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
            }
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            style={{
              width: "100%",
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
            }}
          />
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "16px 24px",
            paddingBottom:
              "max(20px, calc(10px + env(safe-area-inset-bottom)))",
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
          </div>

          {/* Inline calendar — fades in over the same region */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              opacity: datePickerOpen ? 1 : 0,
              transition: datePickerOpen
                ? `opacity ${LOG_VIEW_TRANSITION} 70ms`
                : `opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1)`,
              pointerEvents: datePickerOpen ? "auto" : "none",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
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
                  "max(20px, calc(10px + env(safe-area-inset-bottom)))",
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

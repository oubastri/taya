"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toDateKey } from "@/types/workout";
import { Header } from "@/components/Header";
import { SegmentedControl, type SegmentId } from "@/components/SegmentedControl";
import { Runner } from "@/components/Runner";
import { StatsBlock } from "@/components/StatsBlock";
import { CalendarView } from "@/components/CalendarView";
import { DayDetailModal } from "@/components/DayDetailModal";
import { AddWorkoutModal } from "@/components/AddWorkoutModal";
import { useWorkouts } from "@/hooks/use-workouts";

export default function Home() {
  const [view, setView] = useState<SegmentId>("mooves");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const { stats, hydrated, workouts, getWorkoutByDate, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [dateKeyToAdd, setDateKeyToAdd] = useState<string | null>(null);
  const [addButtonHovered, setAddButtonHovered] = useState(false);
  const [controlRowWidth, setControlRowWidth] = useState<number | null>(null);
  const [equationCopied, setEquationCopied] = useState(false);
  const [copyBtnHovered, setCopyBtnHovered] = useState(false);
  const [equationTypedLength, setEquationTypedLength] = useState(0);
  const typewriterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlRowRef = useRef<HTMLDivElement>(null);

  const equationFullText = "a human body + movement over time\n= an athlete\n= a healthy body\n= a better, happier human";
  const equationText = `a human body + movement over time
= an athlete
= a healthy body
= a better, happier human`;

  const copyEquation = async () => {
    await navigator.clipboard.writeText(equationText);
    setEquationCopied(true);
    setTimeout(() => setEquationCopied(false), 2000);
  };

  useEffect(() => {
    const el = controlRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setControlRowWidth(el.offsetWidth));
    ro.observe(el);
    setControlRowWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // Terminal typewriter: runs when user switches to manifesto
  useEffect(() => {
    if (view !== "manifesto") {
      setEquationTypedLength(0);
      return;
    }
    setEquationTypedLength(0);
    let index = 0;
    const charDelay = 42;
    const newlineDelay = 180;

    function typeNext() {
      if (index >= equationFullText.length) return;
      const char = equationFullText[index];
      const delay = char === "\n" ? newlineDelay : charDelay;
      typewriterTimeoutRef.current = setTimeout(() => {
        index += 1;
        setEquationTypedLength(index);
        typeNext();
      }, delay);
    }

    const startDelay = 320;
    const startTimeout = setTimeout(typeNext, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    };
  }, [view]);

  const workoutDates = useMemo(
    () => new Set(workouts.map((w) => w.date)),
    [workouts]
  );
  const today = useMemo(() => toDateKey(new Date()), []);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };
  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const selectedWorkout = selectedDateKey
    ? getWorkoutByDate(selectedDateKey)
    : null;

  return (
    <main
      className="relative overflow-x-hidden overflow-y-auto p-0 m-0"
      style={{
        minHeight: "max(700px, 100vh)",
        height: "max(700px, 100vh)",
      }}
    >
      <div
        className="relative z-10 flex flex-col"
        style={{ minHeight: "max(700px, 100vh)" }}
      >
        <Header />
        <div
          className="flex w-full justify-center"
          style={{ marginTop: 62 }}
        >
          <div
            ref={controlRowRef}
            className="flex items-center gap-[clamp(4px,0.8vw,8px)]"
          >
            <SegmentedControl value={view} onChange={setView} />
            <button
            type="button"
            aria-label="Log workout for today"
            style={{
              width: "clamp(28px, 5.2vw + 20px, 58px)",
              height: "clamp(28px, 5.2vw + 20px, 58px)",
              padding: 0,
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(11px, 2vw + 8px, 24px)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.04em",
              color: addButtonHovered ? "#000" : "#FFF",
              backgroundColor: addButtonHovered ? "#11EB0E" : "#000",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              transition:
                "border-radius 0.3s ease, background-color 0.3s ease, color 0.3s ease",
            }}
            onMouseEnter={() => setAddButtonHovered(true)}
            onMouseLeave={() => setAddButtonHovered(false)}
            onClick={() => setDateKeyToAdd(today)}
          >
            <svg
              width="50%"
              height="50%"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          </div>
        </div>

        {view === "calendar" ? (
          <div
            className="flex flex-1 flex-col items-center justify-center py-8"
            style={{
              width: controlRowWidth ?? undefined,
              maxWidth: "100%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <CalendarView
              year={calendarMonth.year}
              month={calendarMonth.month}
              workoutDates={workoutDates}
              today={today}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDate={(dateKey) => setSelectedDateKey(dateKey)}
              onAddWorkout={(dateKey) => setDateKeyToAdd(dateKey)}
            />
          </div>
        ) : null}

        {view === "manifesto" ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center px-4 pb-32 pt-24">
            <article
              className="font-sans text-black"
              style={{
                fontFamily: '"Lexend Deca", var(--font-sans), sans-serif',
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: "clamp(1rem, 2vw, 1.125rem)",
                lineHeight: 1.65,
                letterSpacing: "-0.04em",
                width: controlRowWidth ?? undefined,
                maxWidth: "100%",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>
                to all you athletes,
              </p>
              <p style={{ margin: "1em 0 0" }}>
                i have a deep belief that every human is an athlete.
                not because we win things.
                not because we train a certain way.
                but because we live in our bodies.
              </p>
              <div
                style={{
                  margin: "1.75em 0",
                  position: "relative",
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#fafafa",
                }}
              >
                {/* Minimal code block – light bg, green accent */}
                <div
                  style={{
                    display: "flex",
                    background: "transparent",
                    borderLeft: "3px solid #11EB0E",
                    padding: "1rem 1rem 1rem 1.25rem",
                    paddingTop: "2.25rem",
                  }}
                >
                  <pre
                    className="whitespace-pre-wrap font-mono text-left"
                    style={{
                      margin: 0,
                      fontSize: "0.9em",
                      lineHeight: 1.7,
                      letterSpacing: "0.02em",
                      color: "#333",
                    }}
                  >
                    {(() => {
                      const current = equationFullText.slice(0, equationTypedLength);
                      const parts = current.split("=");
                      return (
                        <>
                          {parts.map((part, i) => (
                            <span key={i}>
                              {part}
                              {i < parts.length - 1 ? (
                                <span style={{ color: "#11EB0E", fontWeight: 600 }}>=</span>
                              ) : null}
                            </span>
                          ))}
                          <span
                            className="cursor-blink"
                            style={{ color: "#11EB0E", fontWeight: 600 }}
                            aria-hidden
                          >
                            ▌
                          </span>
                        </>
                      );
                    })()}
                  </pre>
                </div>
                {/* Copy button */}
                <button
                  type="button"
                  onClick={copyEquation}
                  onMouseEnter={() => setCopyBtnHovered(true)}
                  onMouseLeave={(e) => {
                    setCopyBtnHovered(false);
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = copyBtnHovered ? "scale(1.08)" : "scale(1)")}
                  aria-label={equationCopied ? "Copied" : "Copy"}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    padding: 0,
                    color: equationCopied ? "#11EB0E" : copyBtnHovered ? "#fff" : "rgba(0,0,0,0.4)",
                    background: copyBtnHovered ? "#11EB0E" : equationCopied ? "rgba(17,235,14,0.15)" : "transparent",
                    border: copyBtnHovered ? "none" : "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 4,
                    cursor: "pointer",
                    transition: "color 0.2s ease, background 0.2s ease, border 0.2s ease, transform 0.15s ease",
                    transform: copyBtnHovered ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {equationCopied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
              <p style={{ margin: "1em 0 0" }}>
                that's why i call them moves, not workouts.
                some days it's a long walk.
                some days it's yoga.
                some days it's lifting, pilates, a pickup game, a studio class,
                a run outside, a long stretch at night.
                it all counts.
              </p>
              <p style={{ margin: "1em 0 0" }}>
                the only thing that matters
                is that you move your body.
                however that looks today.
              </p>
              <p style={{ margin: "1em 0 0" }}>
                one move.
                then another.
                that's the whole thing.
              </p>
              <p style={{ margin: "1em 0 0" }}>
                maybe you've been doing this for years.
                maybe today is the first day you write it down.
                either way, imagine what this looks like a year from now.
              </p>
              <p style={{ margin: "1em 0 0" }}>
                keep it up.
              </p>
              <p style={{ margin: "1em 0 0" }}>
                this is still early.
                if something's missing to help us athletes,{" "}
                <a
                  href="https://x.com/alexoubari"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:no-underline"
                  style={{ color: "#11EB0E" }}
                >
                  dm me on x
                </a>
                .
                i'm listening. i'll build it and add it here.
              </p>
              <p className="whitespace-pre-wrap" style={{ margin: "1.5em 0 0" }}>
                {`with love,
alex oubari`}
              </p>
            </article>
          </div>
        ) : null}

        {view === "mooves" ? (
          <>
            <div
              className="flex flex-1 min-h-0 flex-shrink-0 items-center justify-center px-4"
              style={{ minHeight: 220 }}
              aria-hidden={!hydrated}
            >
              {hydrated ? (
                <StatsBlock stats={stats} />
              ) : (
                <div
                  className="font-sans text-center text-black"
                  style={{ fontSize: "40px", letterSpacing: "-1.6px" }}
                >
                  …
                </div>
              )}
            </div>
            <Runner fixed={false} />
          </>
        ) : null}
      </div>

      {view === "calendar" && selectedWorkout && (
        <DayDetailModal
          isOpen
          onClose={() => setSelectedDateKey(null)}
          dateKey={selectedWorkout.date}
          description={selectedWorkout.description}
          onEdit={() => {
            setDateKeyToAdd(selectedWorkout.date);
            setSelectedDateKey(null);
          }}
          onDelete={() => {
            deleteWorkout(selectedWorkout.date);
            setSelectedDateKey(null);
          }}
        />
      )}

      {dateKeyToAdd !== null && (
        <AddWorkoutModal
          key={dateKeyToAdd}
          isOpen
          onClose={() => setDateKeyToAdd(null)}
          dateKey={dateKeyToAdd}
          initialDescription={getWorkoutByDate(dateKeyToAdd)?.description ?? ""}
          onSubmit={(description) => {
            const existing = getWorkoutByDate(dateKeyToAdd);
            if (existing) {
              updateWorkout(dateKeyToAdd, description);
            } else {
              addWorkout(dateKeyToAdd, description);
            }
            setDateKeyToAdd(null);
          }}
        />
      )}
    </main>
  );
}

import { useEffect, useRef, type RefObject } from "react";

type Options = {
  enabled: boolean;
  scrollRef: RefObject<HTMLElement | null>;
  onPullMove: (dy: number) => void;
  /** Called on touchend if the user had started a pull-to-dismiss from the top scroll edge. */
  onPullCommit: () => void;
};

/**
 * When a sheet’s scroll view is scrolled to the top, dragging down moves the sheet
 * (iOS-style) instead of scrolling the page behind it.
 */
export function useSheetScrollPullDown({
  enabled,
  scrollRef,
  onPullMove,
  onPullCommit,
}: Options) {
  const moveRef = useRef(onPullMove);
  const commitRef = useRef(onPullCommit);
  moveRef.current = onPullMove;
  commitRef.current = onPullCommit;

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    let startY = 0;
    let armed = false;
    let pulling = false;

    const touchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return;
      armed = true;
      startY = e.touches[0].clientY;
      pulling = false;
    };

    const touchMove = (e: TouchEvent) => {
      if (!armed) return;
      if (el.scrollTop > 0) {
        armed = false;
        return;
      }
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) {
        e.preventDefault();
        pulling = true;
        moveRef.current(dy);
      }
    };

    const touchEnd = () => {
      if (pulling) commitRef.current();
      armed = false;
      pulling = false;
    };

    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: false });
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("touchcancel", touchEnd);

    return () => {
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", touchEnd);
      el.removeEventListener("touchcancel", touchEnd);
    };
  }, [enabled, scrollRef]);
}

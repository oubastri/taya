"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import HomeLanding from "@/components/HomeLanding";

type AuthLandingScaffoldProps = {
  children: React.ReactNode;
};

const EASE = [0.16, 1, 0.3, 1] as const;
/** Panel close — keep in sync with motion `transition.duration` below */
const PANEL_CLOSE_S = 0.36;
const SCRIM_CLOSE_S = 0.34;
const ROUTE_CROSS_S = 0.2;

const AuthLandingRequestCloseContext = createContext<(() => void) | null>(null);

/** Call from auth pages to dismiss the landing modal with exit animation (X, etc.). */
export function useAuthLandingRequestClose() {
  return useContext(AuthLandingRequestCloseContext);
}

/**
 * Desktop: dimmed landing + scrim + centered auth card.
 * Mobile (&lt;640px): auth fills the viewport (landing hidden for clarity / perf).
 */
export function AuthLandingScaffold({ children }: AuthLandingScaffoldProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameLive = useRef(pathname);
  pathnameLive.current = pathname;

  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const closeOriginPath = useRef<string | null>(null);

  const requestClose = useCallback(() => {
    if (leavingRef.current) return;
    closeOriginPath.current = pathnameLive.current;
    leavingRef.current = true;
    setLeaving(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  const onPanelAnimationComplete = useCallback(() => {
    if (!leavingRef.current) return;
    const origin = closeOriginPath.current;
    leavingRef.current = false;
    closeOriginPath.current = null;

    if (origin === null || pathnameLive.current !== origin) {
      setLeaving(false);
      return;
    }
    router.push("/");
  }, [router]);

  return (
    <AuthLandingRequestCloseContext.Provider value={requestClose}>
      <div className="auth-landing-scaffold">
        <div className="auth-landing-scaffold__bg" aria-hidden>
          <HomeLanding />
        </div>
        <motion.button
          type="button"
          className="auth-landing-scaffold__scrim"
          aria-label="Close and return home"
          onClick={requestClose}
          initial={{ opacity: 0 }}
          animate={
            leaving
              ? { opacity: 0, transition: { duration: SCRIM_CLOSE_S, ease: EASE } }
              : { opacity: 1, transition: { duration: 0.32, ease: EASE } }
          }
        />
        <motion.div
          className={
            leaving
              ? "auth-landing-scaffold__panel auth-landing-scaffold__panel--leaving"
              : "auth-landing-scaffold__panel"
          }
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 20, scale: 0.988 }}
          animate={
            leaving
              ? {
                  opacity: 0,
                  y: 14,
                  scale: 0.985,
                  transition: { duration: PANEL_CLOSE_S, ease: EASE },
                }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.38, ease: EASE },
                }
          }
          onAnimationComplete={onPanelAnimationComplete}
        >
          <div className="auth-landing-scaffold__route-host">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                className="auth-landing-scaffold__route"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: ROUTE_CROSS_S, ease: EASE },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: ROUTE_CROSS_S * 0.78, ease: EASE },
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AuthLandingRequestCloseContext.Provider>
  );
}

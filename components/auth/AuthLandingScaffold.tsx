"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomeLanding from "@/components/HomeLanding";

type AuthLandingScaffoldProps = {
  children: React.ReactNode;
};

/**
 * Desktop: dimmed landing + scrim + centered auth card.
 * Mobile (&lt;640px): auth fills the viewport (landing hidden for clarity / perf).
 */
export function AuthLandingScaffold({ children }: AuthLandingScaffoldProps) {
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="auth-landing-scaffold">
      <div className="auth-landing-scaffold__bg" aria-hidden>
        <HomeLanding />
      </div>
      <button
        type="button"
        className="auth-landing-scaffold__scrim"
        aria-label="Close and return home"
        onClick={() => router.push("/")}
      />
      <div
        className="auth-landing-scaffold__panel"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

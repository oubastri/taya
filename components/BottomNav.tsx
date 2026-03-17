"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogSheet } from "@/contexts/log-sheet";
import { useUser } from "@/hooks/use-user";

export function BottomNav() {
  const { open } = useLogSheet();
  const { user } = useUser();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isFriends = pathname === "/friends" || pathname.startsWith("/friends/");
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const activeIndex = isHome ? 0 : isFriends ? 1 : isProfile ? 2 : -1;

  return (
    <nav aria-label="Main navigation" className="bottom-nav-wrapper">
      {/* Main pill: Home · Friends · Profile */}
      <div
        className="liquid-glass-nav"
        style={{ "--active-index": activeIndex >= 0 ? activeIndex : 0 } as React.CSSProperties}
      >
        <div
          className="nav-indicator"
          aria-hidden
          style={{ opacity: activeIndex >= 0 ? 1 : 0 }}
        />
        {/* Home / Feed */}
        <Link
          href="/"
          aria-label="Home"
          className="nav-item"
          data-active={isHome || undefined}
        >
          <Image
            src={isHome ? "/icons/tabbar/feed-selected.svg" : "/icons/tabbar/feed-unselected.svg"}
            alt=""
            width={22}
            height={22}
            aria-hidden
          />
        </Link>

        {/* Friends */}
        <Link
          href="/friends"
          aria-label="Friends"
          className="nav-item"
          data-active={isFriends || undefined}
        >
          <Image
            src={isFriends ? "/icons/tabbar/friend-selected.svg" : "/icons/tabbar/friends-unselected.svg"}
            alt=""
            width={22}
            height={22}
            aria-hidden
          />
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          aria-label="Profile"
          className="nav-item"
          data-active={isProfile || undefined}
        >
          {user.avatarUrl ? (
            <div className="nav-avatar" data-active={isProfile || undefined}>
              <img src={user.avatarUrl} alt={user.name ?? "Profile"} />
            </div>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
              <path d="M5,15l1.586-5.549c.245-.859,1.03-1.451,1.923-1.451h6.983c.893,0,1.678,.592,1.923,1.451l1.586,5.549" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
              <line x1="15" y1="23" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              <line x1="9" y1="12" x2="9" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
          )}
        </Link>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={() => open()}
        aria-label="Log a move"
        className="nav-add-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  );
}

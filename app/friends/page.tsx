"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useFriends } from "@/hooks/use-friends";
import type { FriendData } from "@/types/user";
import { shareUrl } from "@/lib/share";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        backgroundColor: "var(--foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "var(--accent)",
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function FriendCard({
  friend,
  onFollow,
  onUnfollow,
}: {
  friend: FriendData;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
}) {
  const following = friend.following;
  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-md)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <Avatar name={friend.name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {friend.name}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--foreground-subtle)",
          }}
        >
          @{friend.handle}
          {friend.workouts.length > 0 && (
            <span style={{ marginLeft: 6 }}>
              · {friend.workouts.length} move{friend.workouts.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => (following ? onUnfollow(friend.id) : onFollow(friend.id))}
        style={{
          padding: "8px 18px",
          borderRadius: "var(--radius-full)",
          border: following ? "1.5px solid var(--border-strong)" : "none",
          backgroundColor: following ? "transparent" : "var(--foreground)",
          color: following ? "var(--foreground-muted)" : "var(--surface)",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "inherit",
          letterSpacing: "0.02em",
          cursor: "pointer",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
          transition: "all 0.2s ease",
        }}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        margin: "28px 0 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--foreground-subtle)",
        paddingLeft: 4,
      }}
    >
      {label}
    </p>
  );
}

export default function FriendsPage() {
  const { friends, follow, unfollow, hydrated } = useFriends();
  const [query, setQuery] = useState("");
  const [contactsState, setContactsState] = useState<
    "idle" | "unsupported" | "synced"
  >("idle");
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleInviteFriends = useCallback(async () => {
    const ok = await shareUrl("/", {
      title: "TAYA",
      text: "Join me on TAYA — share your moves with friends.",
    });
    if (ok) {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.handle.toLowerCase().includes(q) ||
        f.phone?.includes(q)
    );
  }, [friends, query]);

  const following = friends.filter((f) => f.following);
  const suggestions = friends.filter((f) => !f.following);

  const handleSyncContacts = async () => {
    if (typeof navigator === "undefined" || !("contacts" in navigator)) {
      setContactsState("unsupported");
      return;
    }
    try {
      // @ts-expect-error – Web Contacts API
      await navigator.contacts.select(["name", "tel", "email"], {
        multiple: true,
      });
      setContactsState("synced");
    } catch {
      // cancelled
    }
  };

  const contentMaxWidth = 428;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: contentMaxWidth,
          margin: "0 auto",
          padding: "max(env(safe-area-inset-top), 20px) 16px 96px",
          boxSizing: "border-box",
        }}
      >
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Friends</span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--foreground)",
          marginBottom: 4,
        }}
      >
        Find athletes
      </p>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 14,
          color: "var(--foreground-muted)",
          lineHeight: 1.4,
        }}
      >
        Search by name or @handle to find and follow people.
      </p>
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-md)",
          padding: "6px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--foreground-subtle)"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          type="text"
          placeholder="Name or @handle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "14px 0",
            border: "none",
            fontSize: 15,
            fontFamily: "inherit",
            fontWeight: 500,
            letterSpacing: "-0.015em",
            backgroundColor: "transparent",
            outline: "none",
            color: "var(--foreground)",
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {query.trim() && (
        <>
          {results.length === 0 ? (
            <div style={{ marginTop: 20, paddingLeft: 4 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                No one found
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "var(--foreground-muted)",
                  lineHeight: 1.5,
                }}
              >
                Try a different name or @handle. Or invite friends to join TAYA — they’ll show up here once they sign up.
              </p>
              <button
                type="button"
                onClick={handleInviteFriends}
                style={{
                  marginTop: 16,
                  padding: "12px 20px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  backgroundColor: "var(--accent)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
                className="active:opacity-90"
              >
                Invite friends
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {results.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  onFollow={follow}
                  onUnfollow={unfollow}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!query && (
        <>
          {hydrated && following.length === 0 && suggestions.length === 0 && (
            <div
              style={{
                marginTop: 32,
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                  color: "var(--foreground)",
                }}
              >
                No friends yet
              </p>
              <p
                style={{
                  margin: "12px 0 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--foreground-muted)",
                  lineHeight: 1.5,
                }}
              >
                Sync contacts or invite people to join TAYA. When they sign up, you can find and follow them here.
              </p>
              <button
                type="button"
                onClick={handleInviteFriends}
                style={{
                  padding: "14px 24px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  backgroundColor: "var(--accent)",
                  color: "var(--foreground)",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  boxShadow: "var(--shadow-card)",
                }}
                className="active:opacity-90"
              >
                {inviteCopied ? "Link copied!" : "Invite friends"}
              </button>
            </div>
          )}

          <SectionLabel label="From your contacts" />
          <div>
            {contactsState === "unsupported" ? (
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 18px",
                  boxShadow: "var(--shadow-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--foreground-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  Not available on this browser.{" "}
                  <button
                    type="button"
                    onClick={handleInviteFriends}
                    style={{
                      color: "var(--foreground)",
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                      fontSize: 13,
                      textDecoration: "underline",
                    }}
                  >
                    Copy invite link
                  </button>
                </p>
              </div>
            ) : contactsState === "synced" ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--foreground-subtle)",
                  paddingLeft: 4,
                }}
              >
                Synced ✓
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSyncContacts}
                style={{
                  padding: "12px 22px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--border-strong)",
                  backgroundColor: "var(--surface)",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                Sync contacts
              </button>
            )}
          </div>

          {following.length > 0 && (
            <>
              <SectionLabel label="Following" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {following.map((f) => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    onFollow={follow}
                    onUnfollow={unfollow}
                  />
                ))}
              </div>
            </>
          )}

          {suggestions.length > 0 && (
            <>
              <SectionLabel label="Suggested" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {suggestions.map((f) => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    onFollow={follow}
                    onUnfollow={unfollow}
                  />
                ))}
              </div>
            </>
          )}

          {!hydrated && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 76, borderRadius: "var(--radius-md)" }}
                />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </main>
  );
}

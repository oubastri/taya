"use client";

const green = "var(--accent)";

/** Compact in-orbit previews that echo feed / moves / social without screenshots. */
export function LandingUIMockFeed() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxSizing: "border-box",
        background: "var(--card-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: "var(--avatar-placeholder-bg)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              height: 6,
              width: "72%",
              borderRadius: 3,
              background: "var(--foreground)",
              opacity: 0.2,
            }}
          />
          <div
            style={{
              marginTop: 5,
              height: 5,
              width: "45%",
              borderRadius: 2,
              background: "var(--foreground-muted)",
              opacity: 0.35,
            }}
          />
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.35,
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
        }}
      >
        You <span style={{ color: green, fontWeight: 700 }}>ran</span> morning miles
      </p>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            background: "var(--chip-bg)",
          }}
        />
        <div
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: "var(--separator)",
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}

export function LandingUIMockMoves() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        boxSizing: "border-box",
        background: "linear-gradient(165deg, var(--surface-elevated) 0%, var(--card-bg) 100%)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          color: "var(--foreground)",
          lineHeight: 1,
        }}
      >
        847
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: green,
        }}
      >
        BODIES IN MOTION
      </span>
    </div>
  );
}

export function LandingUIMockTeam() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxSizing: "border-box",
        background: "var(--card-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              marginLeft: i === 0 ? 0 : -10,
              border: "2px solid var(--card-bg)",
              background: "var(--avatar-placeholder-bg)",
              zIndex: 3 - i,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--foreground-muted)",
        }}
      >
        Your crew · live feed
      </span>
    </div>
  );
}

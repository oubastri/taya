"use client";

export type ProfileSection = "about" | "moves";

interface ProfileSegmentedControlProps {
  value: ProfileSection;
  onChange: (value: ProfileSection) => void;
}

function PersonIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function MovesIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M14.2793 9.28223L16.752 1.34277L14.8428 0.74707L12.6924 7.64746L9.25879 8.99902L8.95215 9H2V11H8.32031L10.9229 16.4199L13.4521 14.9688L15.4082 14.5537L14.2793 9.28223Z" />
      <path d="M22.2744 13.1131L21.6139 11.2256L12.1822 14.5271C11.6457 14.7149 11.0546 14.6655 10.5567 14.3913L9.99991 14.0847L9.99999 22.9999L11.9998 22.9999L12.0005 16.7092L22.2744 13.1131Z" />
      <path d="M16.1521 22.0562C17.5328 22.0562 18.6521 20.9369 18.6521 19.5562C18.6521 18.1755 17.5328 17.0562 16.1521 17.0562C14.7714 17.0562 13.6521 18.1755 13.6521 19.5562C13.6521 20.9369 14.7714 22.0562 16.1521 22.0562Z" />
    </svg>
  );
}

export function ProfileSegmentedControl({ value, onChange }: ProfileSegmentedControlProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 9,
      }}
    >
      {([
        { key: "about" as const, label: "About", Icon: PersonIcon },
        { key: "moves" as const, label: "Moves", Icon: MovesIcon },
      ]).map(({ key, label, Icon }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isActive}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 48,
              borderRadius: 9999,
              border: "none",
              backgroundColor: isActive ? "var(--foreground)" : "var(--surface)",
              color: isActive ? "var(--background)" : "var(--foreground)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: 400,
              WebkitTapHighlightColor: "transparent",
              transition: "background-color 0.3s ease, color 0.3s ease",
              backdropFilter: "blur(15px)",
            }}
            className="active:scale-[0.97]"
          >
            <Icon color={isActive ? "var(--background)" : "var(--foreground)"} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

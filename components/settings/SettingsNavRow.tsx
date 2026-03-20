import Link from "next/link";
import { SETTINGS_ROW_ICON_WELL } from "./settingsChrome";

interface SettingsNavRowProps {
  href?: string;
  onClick?: () => void;
  title: string;
  subtitle?: string;
  destructive?: boolean;
  showChevron?: boolean;
  disabled?: boolean;
  /** Leading icon inside the gray rounded square. */
  icon?: React.ReactNode;
}

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "10px 14px",
  border: "none",
  background: "transparent",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  boxSizing: "border-box",
};

const DIVIDER: React.CSSProperties = {
  height: 1,
  margin: 0,
  background: "var(--settings-row-divider)",
};

function Chevron() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, color: "var(--foreground-faint)" }}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsNavRow({
  href,
  onClick,
  title,
  subtitle,
  destructive,
  showChevron = true,
  disabled,
  icon,
}: SettingsNavRowProps) {
  const color = destructive ? "#e53e3e" : "var(--foreground)";
  const subColor = destructive ? "rgba(229,62,62,0.75)" : "var(--foreground-muted)";
  const iconWellStyle: React.CSSProperties = destructive
    ? { ...SETTINGS_ROW_ICON_WELL, color: "#e53e3e", borderColor: "rgba(229,62,62,0.25)" }
    : SETTINGS_ROW_ICON_WELL;

  const inner = (
    <>
      {icon ? <div style={iconWellStyle}>{icon}</div> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color }}>{title}</div>
        {subtitle ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: subColor,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {showChevron ? <Chevron /> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch
        style={{ ...ROW, textDecoration: "none", color: "inherit", display: "flex" }}
        className="active:opacity-85"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...ROW,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className="active:opacity-85"
    >
      {inner}
    </button>
  );
}

export function SettingsRowDivider() {
  return <div style={DIVIDER} role="separator" />;
}

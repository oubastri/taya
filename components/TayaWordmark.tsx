export type TayaWordmarkThemeToggle = {
  onToggle: () => void;
  ariaLabel: string;
};

type TayaWordmarkProps = {
  /** `feed` matches the feed header; `hero` is larger for landing; `figma` matches auth onboarding (457:3158); `landing` matches Figma MVP hero (468:3297) */
  variant?: "feed" | "hero" | "figma" | "landing";
  className?: string;
  /** When set, the title is a control that calls `onToggle` (e.g. landing page theme switch). */
  themeToggle?: TayaWordmarkThemeToggle;
};

const feedType: React.CSSProperties = {
  fontSize: "clamp(26px, 8vw, 36px)",
  fontWeight: 500,
  letterSpacing: "-0.08em",
};

const heroType: React.CSSProperties = {
  fontSize: "clamp(36px, 11vw, 56px)",
  fontWeight: 500,
  letterSpacing: "-0.08em",
};

/** TAYA MVP Create account — Lexend Medium ~38px, tight tracking */
const figmaType: React.CSSProperties = {
  fontSize: "clamp(32px, 8.5vw, 38px)",
  fontWeight: 500,
  letterSpacing: "-0.1em",
  lineHeight: 1.05,
};

/** Figma MacBook landing — large headline, tight tracking */
const landingType: React.CSSProperties = {
  fontSize: "clamp(34px, 7.5vw, 70px)",
  fontWeight: 500,
  letterSpacing: "-0.1em",
  lineHeight: 1.02,
};

export function TayaWordmark({
  variant = "feed",
  className,
  themeToggle,
}: TayaWordmarkProps) {
  const type =
    variant === "hero"
      ? heroType
      : variant === "figma"
        ? figmaType
        : variant === "landing"
          ? landingType
          : feedType;
  const title = (
    <>
      To All You <span style={{ color: "var(--accent)" }}>Athletes</span>
    </>
  );
  return (
    <h1
      className={className}
      style={{
        margin: 0,
        color: "var(--foreground)",
        fontFamily: "var(--font-sans), sans-serif",
        lineHeight: 1.1,
        whiteSpace: variant === "landing" ? "normal" : "nowrap",
        maxWidth: variant === "landing" ? "min(100%, 720px)" : undefined,
        ...type,
      }}
    >
      {themeToggle ? (
        <button
          type="button"
          onClick={themeToggle.onToggle}
          aria-label={themeToggle.ariaLabel}
          className="taya-wordmark-theme-toggle"
          style={{
            display: "block",
            width: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
            letterSpacing: "inherit",
            textAlign: "inherit",
            lineHeight: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {title}
        </button>
      ) : (
        title
      )}
    </h1>
  );
}

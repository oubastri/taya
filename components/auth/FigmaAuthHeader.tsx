import { TayaWordmark } from "@/components/TayaWordmark";
import { figmaPageTitle } from "./figmaAuthStyles";

type FigmaAuthHeaderProps = {
  title: string;
  subtitle?: string;
  /** When false, omit the wordmark (e.g. auth modal over landing). */
  showWordmark?: boolean;
};

export function FigmaAuthHeader({
  title,
  subtitle,
  showWordmark = true,
}: FigmaAuthHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {showWordmark ? <TayaWordmark variant="figma" /> : null}
      <p style={{ ...figmaPageTitle, ...(showWordmark ? {} : { margin: 0 }) }}>{title}</p>
      {subtitle ? (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 15,
            fontWeight: 400,
            color: "var(--foreground-muted)",
            lineHeight: 1.5,
            fontFamily: "var(--font-sans), sans-serif",
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

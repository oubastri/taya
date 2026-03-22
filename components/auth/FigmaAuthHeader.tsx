import { TayaWordmark } from "@/components/TayaWordmark";
import { figmaPageTitle } from "./figmaAuthStyles";

type FigmaAuthHeaderProps = {
  title: string;
  subtitle?: string;
};

export function FigmaAuthHeader({ title, subtitle }: FigmaAuthHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <TayaWordmark variant="figma" />
      <p style={figmaPageTitle}>{title}</p>
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

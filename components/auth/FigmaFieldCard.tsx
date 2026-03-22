import type { ReactNode } from "react";
import { figmaFieldCard, figmaFieldLabel } from "./figmaAuthStyles";

type FigmaFieldCardProps = {
  label: string;
  children: ReactNode;
};

export function FigmaFieldCard({ label, children }: FigmaFieldCardProps) {
  return (
    <div style={figmaFieldCard}>
      <p style={figmaFieldLabel}>{label}</p>
      {children}
    </div>
  );
}

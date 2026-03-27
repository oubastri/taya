import Link from "next/link";

interface IconButtonProps {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  size?: number;
  className?: string;
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  color: "var(--foreground)",
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  textDecoration: "none",
  flexShrink: 0,
};

export function IconButton({
  children,
  label,
  href,
  onClick,
  size = 44,
  className = "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card)] active:opacity-80",
}: IconButtonProps) {
  const style = { ...baseStyle, width: size, height: size };

  if (href) {
    return (
      <Link href={href} style={style} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  );
}

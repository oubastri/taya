import { IconButton } from "./IconButton";

const BackArrow = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    aria-hidden
  >
    <path d="M21 12H3" />
    <path d="M10 19L3 12l7-7" />
  </svg>
);

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

export function BackButton({
  href,
  onClick,
  label = "Go back",
}: BackButtonProps) {
  return (
    <IconButton href={href} onClick={onClick} label={label}>
      <BackArrow />
    </IconButton>
  );
}

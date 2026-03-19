import Image from "next/image";
import { IconButton } from "./IconButton";

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
      <Image
        src="/icons/nav/arrow-left.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden
        className="nav-btn-icon"
      />
    </IconButton>
  );
}

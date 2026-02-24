"use client";

interface UserAvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = { sm: 32, md: 48, lg: 80, xl: 56 } as const;

export function UserAvatar({ avatarUrl, name, size = "md" }: UserAvatarProps) {
  const px = SIZE_MAP[size];

  if (avatarUrl) {
    return (
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          display: "block",
        }}
      >
        <img
          src={avatarUrl}
          alt={name ?? "User avatar"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
      </div>
    );
  }

  // Default: black circle with green running figure silhouette
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 80 80"
      fill="none"
      aria-label={name ? `${name}'s avatar` : "User avatar"}
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#000" />
      {/* Running figure — green silhouette */}
      {/* Head */}
      <circle cx="43" cy="18" r="7" fill="#11EB0E" />
      {/* Torso */}
      <line x1="41" y1="25" x2="37" y2="40" stroke="#11EB0E" strokeWidth="5.5" strokeLinecap="round" />
      {/* Back arm (swings forward-right) */}
      <line x1="40" y1="31" x2="54" y2="27" stroke="#11EB0E" strokeWidth="4.5" strokeLinecap="round" />
      {/* Front arm (swings back-left) */}
      <line x1="40" y1="31" x2="26" y2="38" stroke="#11EB0E" strokeWidth="4.5" strokeLinecap="round" />
      {/* Front leg (strides forward) */}
      <line x1="37" y1="40" x2="27" y2="55" stroke="#11EB0E" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="27" y1="55" x2="22" y2="62" stroke="#11EB0E" strokeWidth="4" strokeLinecap="round" />
      {/* Back leg (extends behind) */}
      <line x1="37" y1="40" x2="50" y2="52" stroke="#11EB0E" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="50" y1="52" x2="56" y2="58" stroke="#11EB0E" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

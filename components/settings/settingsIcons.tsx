/** Minimal line icons for settings rows — flat, inherits currentColor. */

export function IconPerson(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20v-1c0-2.5 2-4.5 7-4.5s7 2 7 4.5v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBubble(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19c-4.418 0-8-3.106-8-7s3.582-7 8-7 8 3.106 8 7c0 1.42-.448 2.76-1.24 3.93L20 19l-4.55-1.82A8.15 8.15 0 0112 19z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPalette(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a7 7 0 107 7c0 .8-.33 1.58-.9 2.15L15 20l-2-2-2 2-2.85-2.85A6.95 6.95 0 015 10a7 7 0 017-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="9.5" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconDoor(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 3h8v18h-8M4 21V3h6v18H4zM14 12h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTrash(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"
      />
    </svg>
  );
}

export function IconMoon(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 017.5 4 8.5 8.5 0 0014.5 21 8.46 8.46 0 0021 14.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBellOff(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 01-3.46 0M2 2l20 20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSliders(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M9 21H6M15 21h-2M18 12h-3M6 8H3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTranslate(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h7M9 3v2M6 5c1.5 4 4 6 7 7M11 12h9M17 12l-2 8M15 20h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPeopleTwo(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 20v-.5a4.5 4.5 0 014.5-4.5h.7A6.3 6.3 0 0115 11.2M15 20v-.5a3.5 3.5 0 013.5-3.5h.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHelpCircle(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9.5 9.5a2.5 2.5 0 014.6 1.3c0 2-2.5 2.2-2.5 3.7M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconInfoCircle(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 16v-5M12 8h.01" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconPersonCircle(props: { size?: number }) {
  const s = props.size ?? 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.5 18.5c1.2-2.5 3.4-4 5.5-4s4.3 1.5 5.5 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconLogout(props: { size?: number }) {
  const s = props.size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 17H5V7h5M14 12h8m-3-3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

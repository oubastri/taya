/** Mail link for in-app “Feedback”; set `NEXT_PUBLIC_FEEDBACK_EMAIL` in production. */
export function getFeedbackMailto(): string {
  const addr = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim();
  const subject = encodeURIComponent("TAYA feedback");
  if (addr) return `mailto:${addr}?subject=${subject}`;
  return `mailto:hello@taya.app?subject=${subject}`;
}

/** Normalize user-typed handle: trim, strip @, lowercase. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

/** Returns an error message if invalid, or null if OK. */
export function validateHandleFormat(clean: string): string | null {
  if (!clean) return "Handle can't be empty.";
  if (!/^[a-z0-9_]{2,20}$/.test(clean)) {
    return "2–20 characters: letters, numbers, underscores only.";
  }
  return null;
}

/**
 * Share a URL via Web Share API when available, otherwise copy to clipboard.
 * Returns true if shared or copied, false if failed (e.g. user cancelled).
 */
export async function shareUrl(
  url: string,
  options?: { title?: string; text?: string }
): Promise<boolean> {
  const fullUrl = typeof window !== "undefined" && url.startsWith("/") ? window.location.origin + url : url;
  if (typeof navigator === "undefined") return false;

  if (navigator.share) {
    try {
      await navigator.share({
        title: options?.title ?? "TAYA",
        text: options?.text,
        url: fullUrl,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name === "AbortError") return false;
      // Fall through to clipboard
    }
  }

  try {
    await navigator.clipboard?.writeText(fullUrl);
    return true;
  } catch {
    return false;
  }
}

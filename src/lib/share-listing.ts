"use client";

export type ShareListingResult = "shared" | "copied" | "aborted" | "unsupported";

/**
 * Native share when available; otherwise copy URL to clipboard.
 */
export async function shareListingUrl(opts: {
  url: string;
  title: string;
  text: string;
}): Promise<ShareListingResult> {
  if (typeof window === "undefined") return "unsupported";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "aborted";
    }
  }

  try {
    await navigator.clipboard.writeText(opts.url);
    return "copied";
  } catch {
    return "unsupported";
  }
}

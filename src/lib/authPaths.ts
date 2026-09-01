/**
 * Same-origin relative path only. Blocks protocol-relative URLs, backslashes, and
 * anything that is not a path on this dashboard.
 */
export const safeNextPath = (raw: string | null | undefined, fallback: string): string => {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  if (raw.includes("://")) return fallback;
  return raw;
};

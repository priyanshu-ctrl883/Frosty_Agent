/** Public bot API base (langgraph) — used by embeddable widgets in browsers. */
export const PUBLIC_BOT_API_URL = (
  process.env.NEXT_PUBLIC_BOT_URL || "https://frostyagent.com/bot-api"
).replace(/\/$/, "");

/** Frosty SaaS backend API base (serves widget.js). */
export const PUBLIC_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://frostyagent.com/api"
).replace(/\/$/, "");

export const WIDGET_SCRIPT_URL = `${PUBLIC_API_BASE}/widget.js`;

/** Script-tag embed copied from the dashboard. */
export function buildWidgetEmbedSnippet(
  apiKey: string,
  opts?: { theme?: string; channel?: string }
): string {
  const key = String(apiKey || "").trim();
  if (!key) {
    return "<!-- Copy your Secret API Key from Dashboard → Web Agent → API Key & Integration -->";
  }
  const theme = opts?.theme ? ` data-theme="${opts.theme}"` : "";
  const channel = ` data-channel="${opts?.channel || "website"}"`;
  return `<script src="${WIDGET_SCRIPT_URL}" data-api-key="${key}" data-api-url="${PUBLIC_BOT_API_URL}/chat"${channel}${theme}></script>`;
}

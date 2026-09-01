/**
 * Install recipes for the website widget — same publishable key + bundle URL,
 * different paste paths (Intercom/Zendesk-style: HTML, SPA framework, GTM).
 */

export type WidgetInstallParts = {
  bundleUrl: string;
  publishableKey: string;
  position: string;
  /** Pins this snippet to one website agent (D210 / D238). */
  agentId?: string | null;
};

export type InstallMethodId = "html" | "react" | "gtm";

export type InstallMethod = {
  id: InstallMethodId;
  label: string;
  hint: string;
  code: string;
};

/** Parse the server-built HTML embed snippet into parts used by other recipes. */
export const parseEmbedSnippet = (snippet: string | null | undefined): WidgetInstallParts | null => {
  if (!snippet?.trim()) return null;
  const bundleUrl = snippet.match(/\bsrc=["']([^"']+)["']/)?.[1];
  const publishableKey =
    snippet.match(/\bdata-frosty-key=["']([^"']+)["']/)?.[1] ||
    snippet.match(/\bdata-frosty-key=["']([^"']+)["']/)?.[1];
  const position =
    snippet.match(/\bdata-frosty-position=["']([^"']+)["']/)?.[1] ||
    snippet.match(/\bdata-frosty-position=["']([^"']+)["']/)?.[1] ||
    "bottom-right";
  const agentId =
    snippet.match(/\bdata-frosty-agent=["']([^"']+)["']/)?.[1] ||
    snippet.match(/\bdata-frosty-agent=["']([^"']+)["']/)?.[1] ||
    null;
  if (!bundleUrl || !publishableKey || publishableKey.includes("…")) return null;
  return { bundleUrl, publishableKey, position, agentId };
};

export const buildInstallMethods = (parts: WidgetInstallParts): InstallMethod[] => {
  const { bundleUrl, publishableKey, position, agentId } = parts;
  const agentAttr = agentId ? `\n        data-frosty-agent="${agentId}"` : "";
  const agentDs = agentId ? `\n    script.dataset.frostyAgent = "${agentId}";` : "";

  const html = `<script src="${bundleUrl}"
        data-frosty-key="${publishableKey}"${agentAttr}
        data-frosty-position="${position}"
        async></script>`;

  const react = `'use client';

import { useEffect } from "react";

/** Add once in your root layout (App Router) or _app (Pages Router). */
export function FrostyWidget() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[data-frosty-key="${publishableKey}"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "${bundleUrl}";
    script.async = true;
    script.dataset.frostyKey = "${publishableKey}";
    script.dataset.frostyPosition = "${position}";${agentDs}
    document.body.appendChild(script);
    // Do not remove the tag on unmount. The IIFE has already painted the launcher;
    // removing it does not tear that down, and React Strict Mode would inject a second copy.
  }, []);

  return null;
}`;

  const gtm = `<!-- Google Tag Manager → Tags → New → Custom HTML → All Pages -->
<script src="${bundleUrl}"
        data-frosty-key="${publishableKey}"${agentAttr}
        data-frosty-position="${position}"
        async></script>`;

  return [
    {
      id: "html",
      label: "HTML / any site",
      hint: "Paste just before </body> on every page where chat should appear (WordPress theme, PHP/Django templates, static HTML).",
      code: html,
    },
    {
      id: "react",
      label: "React / Next.js",
      hint: "Mount FrostyWidget once in the root client layout. Works for React SPAs and Next.js App/Pages Router — same public key as the HTML snippet.",
      code: react,
    },
    {
      id: "gtm",
      label: "Google Tag Manager",
      hint: "Create a Custom HTML tag, paste this, trigger on All Pages, then publish the GTM container. No site deploy required.",
      code: gtm,
    },
  ];
};

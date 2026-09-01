"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { WidgetInstallMethods } from "@/components/widget/WidgetInstallMethods";
import { apiRequest } from "@/lib/api";
import { completeOnboardingStep } from "@/lib/onboarding";
import { OnboardingStepBar } from "@/components/onboarding/OnboardingStepBar";
import { contrastRatio, readableOn } from "@/lib/contrast";

import type { Agent, QuickLink, WidgetAppearance, WidgetKeyRotation, WidgetSettings } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import styles from "./widget.module.css";

/**
 * Widget customize + embed (Master §G / D206).
 *
 * Appearance lives on each agent's website `agent_channels.settings`. Pass `?agent=` /
 * `agent_id=` to edit a specific website agent; omit to edit the live binding.
 * Config / tools / versions stay on `/agents/[id]`. Knowledge attaches per agent on `/knowledge`.
 */
/** Thermal pine — what the widget itself uses when `color` is blank. */
const FALLBACK_BRAND = "#0396A6";

export default function WidgetPage() {
  const { me } = useWorkspace();
  const [data, setData] = useState<WidgetSettings | null>(null);
  const [form, setForm] = useState<WidgetAppearance | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"snippet" | "key" | null>(null);
  const [rotated, setRotated] = useState<WidgetKeyRotation | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const agentsReady = useRef(false);

  // Intercept wheel events on each panel so they scroll independently
  // instead of the outer page catching them.
  // Depends on `loading` so it re-runs after data loads and refs are populated.
  useEffect(() => {
    const form = formRef.current;
    const preview = previewRef.current;
    if (!form && !preview) return;

    function onWheel(e: WheelEvent) {
      const el = e.currentTarget as HTMLElement;
      if (!el) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + e.deltaY));
    }

    form?.addEventListener("wheel", onWheel, { passive: false });
    preview?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      form?.removeEventListener("wheel", onWheel);
      preview?.removeEventListener("wheel", onWheel);
    };
  }, [loading]);

  const settingsPath = agentId
    ? `/v1/widget/settings?agent_id=${encodeURIComponent(agentId)}`
    : "/v1/widget/settings";

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!agentsReady.current) {
        const list = await apiRequest<Agent[]>("/v1/agents");
        const webCapable = (list || []).filter(
          (a) => a.mode === "website" || a.mode === "unified",
        );
        setAgents(webCapable);
        agentsReady.current = true;
        const pref =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("agent")
            : null;
        if (pref && webCapable.some((a) => a.id === pref)) {
          setAgentId(pref);
          return; // load will re-run when agentId updates
        }
        const only = webCapable[0];
        if (webCapable.length === 1 && only) {
          setAgentId(only.id);
          return;
        }
      }
      const snap = await apiRequest<WidgetSettings>(settingsPath);
      setData(snap);
      setForm(snap.appearance);
      if (snap.agent_id && !agentId) setAgentId(snap.agent_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your widget settings");
    } finally {
      setLoading(false);
    }
  }, [settingsPath, agentId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  function set<K extends keyof WidgetAppearance>(key: K, value: WidgetAppearance[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const snap = await apiRequest<WidgetSettings>(settingsPath, {
        method: "PATCH",
        body: form,
      });
      setData(snap);
      setForm(snap.appearance);
      void completeOnboardingStep("configure_channels").catch(() => null);
      setNotice("Saved. Live on your site on the next page load — no need to re-paste the snippet.");

    } catch (err) {
      // The server validates the colour, the logo URL scheme and type, the lengths and the
      // quick-link cap, and its messages name the field. Showing them verbatim beats guessing.
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function rotateKey() {
    if (
      !window.confirm(
        "Rotating takes your live chat DOWN until you paste the new snippet into your site. " +
          "The old key stops working immediately. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<WidgetKeyRotation>("/v1/widget/key", { method: "POST" });
      setRotated(out);
      setNotice("Key rotated. Paste the new snippet into your site now — chat is down until you do.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rotate the key");
    } finally {
      setBusy(false);
    }
  }

  async function copy(what: "snippet" | "key", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setError("Could not copy — select the text and copy it manually.");
    }
  }

  function addQuickLink() {
    if (!form) return;
    // Capped at 6 by the server (`quick_links` has `max_length=6`); stopping here means the
    // merchant is told before they type rather than after they save.
    if (form.quick_links.length >= 6) {
      setError("Six quick links is the maximum.");
      return;
    }
    set("quick_links", [...form.quick_links, { label: "", url: "" }]);
  }

  function setQuickLink(i: number, patch: Partial<QuickLink>) {
    if (!form) return;
    set(
      "quick_links",
      form.quick_links.map((q, n) => (n === i ? { ...q, ...patch } : q)),
    );
  }

  const isOwner = Boolean(me?.is_owner);
  // The colour the real widget falls back to when the merchant has set none — matched to Thermal's
  // pine so the preview is not lying about the default.
  const brand = form?.color || FALLBACK_BRAND;
  /*
   * ⚠️ A MID-TONE BRAND COLOUR CANNOT BE MADE READABLE BY EITHER BLACK OR WHITE, and the widget's
   * own test proves it: `#808080` tops out at 4.49:1 against a 4.5:1 floor. `readableOn` picks the
   * better of the two, which is all it can do — so the merchant has to be TOLD, rather than shipped
   * a launcher their own visitors squint at. This is the whole reason `contrastRatio` is exported.
   */
  const brandContrast = contrastRatio(brand, readableOn(brand));
  const brandUnreadable = brandContrast !== null && brandContrast < 4.5;

  return (
    <AppShell
      title="Widget"
      subtitle="How the chat looks on your site, and the snippet that puts it there."
      /* GET and PATCH are both gated on `widget:config` — the Master names one code for both verbs
         (§B3), so a viewer cannot even read this screen. That is the spec's call, not ours (0038). */
      requires="widget:config"
    >
      <OnboardingStepBar
        stepKey="configure_channels"
        stepTitle="Configure channels & website widget"
        stepOrder={4}
        nextPath="/website?tab=settings&subtab=sandbox"
        isCompleted={Boolean(data?.channel_enabled)}
      />
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}

      {notice ? <p className={styles.hint}>{notice}</p> : null}

      {loading || !data || !form ? (
        <PageState
          icon="widgets"
          title={loading ? "Loading…" : "No widget settings"}
          description={loading ? "Fetching your widget configuration." : "Try refreshing."}
        />
      ) : (
        <>
          {/* §G's edge case, and only the server knows it: "Website channel disabled → snippet page
              warns 'channel off'". `resolve_widget_key` INNER JOINs `ch.enabled`, so a disabled
              channel makes a valid key resolve to nothing — the widget goes dark for every visitor
              while this screen would otherwise look perfectly healthy. */}
          {!data.channel_enabled ? (
            <div className={styles.error} role="status">
              <strong>Your website channel is switched off.</strong> Anything you change here is
              saved, but the widget will not load for visitors until the channel is enabled on the{" "}
              <Link href={agentId ? `/agents/${agentId}` : "/agents"}>agent</Link>.
            </div>
          ) : null}

          {agents.length > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Configure appearance for:</span>
              <Select
                value={agentId}
                onChange={(v) => {
                  setAgentId(v);
                  setLoading(true);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    if (v) url.searchParams.set("agent", v);
                    else url.searchParams.delete("agent");
                    window.history.replaceState({}, "", url.toString());
                  }
                }}
                options={[
                  { value: "", label: "Live widget binding (default)" },
                  ...agents.map((a) => ({
                    value: a.id,
                    label: `${a.agent_name || a.slug} · ${a.mode}`,
                  })),
                ]}
                style={{ minWidth: 280 }}
              />
              {agentId ? (
                <Link href={`/agents/${agentId}`} style={{ fontSize: 13, fontWeight: 600 }}>
                  Open agent config →
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className={styles.layout}>
            <form ref={formRef} className={styles.form} onSubmit={(e) => void onSave(e)}>
              <h2>Appearance</h2>
              <Field
                label="Panel title"
                name="title"
                value={form.title}
                onChange={(v) => set("title", v)}
                hint="Shown at the top of the chat panel."
              />
              <Field
                label="Greeting"
                name="greeting"
                value={form.greeting}
                onChange={(v) => set("greeting", v)}
                hint="The first thing a visitor reads, before they type."
              />
              <Field
                label="Launcher label"
                name="launcher_label"
                value={form.launcher_label}
                onChange={(v) => set("launcher_label", v)}
                hint="The button in the corner. Also its accessible name."
              />
              <div className={styles.colorField}>
                <label htmlFor="color">Brand colour</label>
                <div>
                  <input
                    id="color"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#0396A6"}
                    onChange={(e) => set("color", e.target.value)}
                  />
                  <input
                    aria-label="Brand colour hex"
                    value={form.color}
                    placeholder="#0396A6"
                    onChange={(e) => set("color", e.target.value)}
                  />
                </div>
                <p className={styles.hint}>
                  A hex value. Leave it blank to use the Frosty default.
                </p>
                {brandUnreadable ? (
                  <p className={styles.error}>
                    ⚠️ Text on this colour only reaches {brandContrast?.toFixed(1)}:1 contrast —
                    below the 4.5:1 accessibility floor, and no text colour can fix it. Pick
                    something darker or lighter so your launcher stays legible.
                  </p>
                ) : null}
              </div>
              <Field
                label="Logo URL"
                name="logo_url"
                value={form.logo_url}
                onChange={(v) => set("logo_url", v)}
                hint={
                  "An https image — png, jpg, webp or gif. SVG is refused: it is the one image " +
                  "format that is also a markup document. Rendered at 24px, and removed if it " +
                  "fails to load. ⚠️ The SIZE cannot be checked here — doing so would mean fetching " +
                  "an address you supplied from our server, which is the SSRF we refuse elsewhere."
                }
              />
              <div className={styles.selectField}>
                <label htmlFor="position">Position</label>
                <Select
                  value={form.position}
                  onChange={(v) =>
                    set("position", v as WidgetAppearance["position"])
                  }
                  options={[
                    { value: "bottom-right", label: "Bottom right" },
                    { value: "bottom-left", label: "Bottom left" }
                  ]}
                />
                <p className={styles.hint}>
                  The one appearance field baked into the snippet — the launcher is drawn before any
                  session exists, so changing this <strong>does</strong> mean re-pasting.
                </p>
              </div>
              <div className={styles.areaField}>
                <label htmlFor="consent">Consent notice</label>
                <textarea
                  id="consent"
                  value={form.consent_notice}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => set("consent_notice", e.target.value)}
                />
                <p className={styles.hint}>
                  Shown before the visitor types, including on a return visit — a notice that appears
                  after someone has typed is not a notice.
                </p>
              </div>

              <h2>Quick links</h2>
              <p className={styles.hint}>
                Suggested openers. A link with no URL sends its label as the first message, which is
                usually what &quot;Book a demo&quot; wants to be.
              </p>
              {form.quick_links.map((q, i) => (
                <div className={styles.formRow} key={i}>
                  <Field
                    label={`Label ${i + 1}`}
                    name={`ql-label-${i}`}
                    value={q.label}
                    onChange={(v) => setQuickLink(i, { label: v })}
                  />
                  <Field
                    label={`URL ${i + 1} (optional)`}
                    name={`ql-url-${i}`}
                    value={q.url || ""}
                    onChange={(v) => setQuickLink(i, { url: v })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      set(
                        "quick_links",
                        form.quick_links.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={addQuickLink}>
                Add quick link
              </Button>

              <div className={styles.formActions}>
                <Button type="submit" loading={busy}>
                  Save appearance
                </Button>
              </div>
            </form>

            <div ref={previewRef} className={styles.previewCol}>
              {/*
                A LIVE PREVIEW, drawn from the form state rather than from an iframe.
                §G lists live preview as a nice-to-have, and this is the honest version of it: it
                shows the colour, title, greeting, logo, consent notice and quick links exactly as
                the form has them, and it does NOT pretend to be the real widget — the real one is a
                cross-origin iframe (D57) and embedding it here would need a live session, a
                conversation row and a billable first turn to render anything at all.
              */}
              <div>
                <h2>Preview</h2>
                <div className={styles.previewFrame} data-position={form.position}>
                  {/* ⚠️ The foreground is COMPUTED from the merchant's colour, not a token — see
                      `readableOn`. A token cannot be right for a colour the merchant chooses at
                      runtime, and dark mode measured 2.26:1 before this. */}
                  <div
                    className={styles.previewChrome}
                    style={{
                      background: brand,
                      color: readableOn(form.color || FALLBACK_BRAND),
                    }}
                  >
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logo_url}
                        alt=""
                        height={24}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <strong>{form.title || "Chat with us"}</strong>
                  </div>
                  <div className={styles.previewBody}>
                    <p className={styles.bubble}>{form.greeting || "Hi! How can we help?"}</p>
                    {form.quick_links.filter((q) => q.label).length ? (
                      <div className={styles.position}>
                        {form.quick_links
                          .filter((q) => q.label)
                          .map((q, i) => (
                            <span key={i} className={styles.snippetTab}>
                              {q.label}
                            </span>
                          ))}
                      </div>
                    ) : null}
                    {form.consent_notice ? (
                      <p className={styles.snippetHint}>{form.consent_notice}</p>
                    ) : null}
                  </div>
                  <div
                    className={styles.launcher}
                    style={{ background: brand, color: readableOn(form.color || FALLBACK_BRAND) }}
                  >
                    {form.launcher_label || "Open chat"}
                  </div>
                </div>
              </div>

              <div className={styles.embed}>
                <div className={styles.embedHead}>
                  <h2>Install</h2>
                </div>
                <p className={styles.hint}>
                  Choose how your site loads Frosty — same public key for every method (HTML, React /
                  Next.js, or Google Tag Manager).
                </p>
                <div className="mt-3 mb-4">
                  <WidgetInstallMethods
                    embedSnippet={data.embed_snippet}
                    publishableKey={rotated?.publishable_key || data.publishable_key}
                    position={form?.position || data.appearance?.position}
                    agentId={data.agent_id || agentId}
                  />
                </div>

                <div className={styles.embedHead}>
                  <h2>Publishable key</h2>
                </div>
                <p className={styles.hint}>
                  Safe to publish — it is in the page source of every site running your widget. It
                  identifies you; it authorises nothing.
                </p>
                <div className="relative group mt-2 mb-4">
                  <pre>{rotated?.publishable_key || data.publishable_key || "—"}</pre>
                  <button
                    type="button"
                    title={copied === "key" ? "Copied!" : "Copy key"}
                    onClick={() =>
                      void copy("key", rotated?.publishable_key || data.publishable_key || "")
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/80 text-muted-foreground hover:text-foreground transition-all shadow-sm flex items-center justify-center"
                  >
                    {copied === "key" ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* ⚠️ OWNER ONLY, and it is a SECOND gate on top of `widget:config` — a manager holds
                    that code and still cannot rotate. Master §B3: "API key rotate | Owner only".
                    Configuring the widget and taking the customer's live site dark are different
                    powers, so the button is absent rather than disabled for anyone else. */}
                {isOwner ? (
                  <>
                    <div className={styles.embedHead}>
                      <h2>Rotate</h2>
                    </div>
                    <p className={styles.hint}>
                      <strong>This takes your live chat down</strong> until you paste the new snippet
                      into your site. There is no grace period and no second active key.
                    </p>
                    <Button type="button" variant="danger" disabled={busy} onClick={() => void rotateKey()}>
                      Rotate publishable key
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import type { ApiKeyRotation, MerchantSettings } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { Key, Code, Webhook, Check, Copy, RotateCw, ExternalLink, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";

/* â”€â”€ Design Tokens â”€â”€ */
const T = {
  primary: '#0396A6', // Forest green
  buttonBg: '#0396A6', // Darker forest green
  textLight: '#B8D4C8',
  white: '#FFFFFF',
  bgHover: 'rgba(51, 107, 85, 0.04)',
  bgActive: 'rgba(51, 107, 85, 0.1)',
  border: '#D9EDEE',
  shadowActive: '0 20px 60px rgba(51, 107, 85, 0.15)',
};

/* â”€â”€ GlassCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function GlassCard({ children, style, className }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <div className={className || ''}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        boxShadow: h ? T.shadowActive : '0 4px 20px rgba(0,0,0,0.03)',
        transform: h ? 'translateY(-2px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.22,0.61,0.36,1)',
        position: 'relative', overflow: 'hidden', ...style
      }}
    >
      <div style={{
        position: 'absolute', top: -100, right: -100, width: 200, height: 200,
        background: `radial-gradient(circle, ${T.primary}1A 0%, transparent 70%)`,
        opacity: h ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SectionHeader({ title, icon, toggle }: {
  title: string; icon: React.ReactNode; toggle?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.bgActive, color: T.primary }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
      </div>
      {toggle}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function DeveloperSettingsPage() {
  const { me } = useWorkspace();
  const { isImpersonating } = useImpersonation();
  const [data, setData] = useState<MerchantSettings | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!me) return;
    async function init() {
      try {
        const st = await apiRequest<MerchantSettings>("/v1/settings");
        setData(st);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load settings");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [me]);

  async function onRotateKey() {
    if (!window.confirm("Are you sure? Rotating your publishable key immediately invalidates the previous token on your live website.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<ApiKeyRotation>("/v1/settings/api-key/rotate", { method: "POST" });
      setRevealedKey(res.publishable_key);
      setShowKey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rotate key");
    } finally {
      setBusy(false);
    }
  }

  const onCopyKey = useCallback(() => {
    const textToCopy = revealedKey || (data as any)?.publishable_key_masked;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => setError("Could not copy to clipboard"));
    }
  }, [revealedKey, data]);

  // Determine what key string to display, and whether we mask it with bullets
  const actualKeyString = revealedKey || (data as any)?.publishable_key_masked || "frosty_live_************************";
  const displayKey = showKey ? actualKeyString : '•'.repeat(actualKeyString.length);

  return (
    <AppShell
      title="Developer Settings & API Access"
      subtitle="Manage your publishable widget API keys, SDK integration tokens, and webhooks."
      requires="dashboard:view"
      actions={
        <div className="flex items-center gap-3">
          <Link href="/webhooks">
            <Button variant="ghost" className="flex items-center gap-2 font-semibold">
              <Webhook size={16} /> Manage Webhooks
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="font-semibold">General Settings</Button>
          </Link>
        </div>
      }
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .settings-fade { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .sd-1 { animation-delay: 0.05s; } .sd-2 { animation-delay: 0.1s; }
      `}</style>

      <EntitlementGate feature="api_access">
      {error && <ErrorBox message={error} />}

      {loading || !data ? (
        <PageState icon="settings" title={loading ? "Loading developer settings..." : "No settings"} description={loading ? "Fetching secure keys." : "Try refreshing."} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40, alignItems: 'stretch' }}>
          
          {/* â”€â”€ LEFT COLUMN â”€â”€ */}
          <div className="flex flex-col gap-8 flex-1">
            <GlassCard className="settings-fade sd-1" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SectionHeader title="Publishable Widget API Key" icon={<Key size={18} />} toggle={
                <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Key
                </span>
              } />
              
              <div className="flex flex-col gap-5 flex-1">
                <p style={{ fontSize: 13, color: '#8B847B', margin: '0 0 12px', lineHeight: 1.5 }}>
                  This token (<code style={{ background: '#EAF8F8', padding: '2px 6px', borderRadius: 6, color: '#111827' }}>frosty_live_…</code>) authenticates your Website Widget on client-side pages. Rotating it invalidates any previously embedded scripts immediately.
                </p>

                <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: '#EAF8F8', border: `1px solid ${T.border}` }}>
                  <code style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {displayKey}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} title={showKey ? "Hide" : "Show"} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid transparent`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#8B847B' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.bgHover; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B847B'; }}>
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button onClick={onCopyKey} title="Copy" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${copied ? T.bgActive : T.border}`, background: copied ? T.bgActive : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: copied ? T.primary : '#8B847B' }}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                {revealedKey && (
                  <div className="flex items-start gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <ShieldAlert size={16} color="#f59e0b" style={{ marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: '#b45309', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                      Important: Copy this secret token now. It will be masked when you leave this page.
                    </p>
                  </div>
                )}
              </div>

              {isImpersonating && (
                <div className="mb-3 text-xs font-bold text-amber-900 bg-amber-100 p-2.5 rounded-xl border border-amber-300">
                  Key regeneration is blocked during active support sessions.
                </div>
              )}

              <button onClick={() => void onRotateKey()} disabled={busy || isImpersonating}
                title={isImpersonating ? "Key rotation is blocked during support session" : undefined}
                style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, border: '1px solid rgba(239,68,68,0.15)', cursor: (busy || isImpersonating) ? 'not-allowed' : 'pointer', opacity: isImpersonating ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', width: 'max-content' }}
                onMouseEnter={(e) => { if (!isImpersonating) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={(e) => { if (!isImpersonating) e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
              >
                <RotateCw size={14} className={busy ? "animate-spin" : ""} /> Regenerate Key
              </button>
            </GlassCard>
          </div>

          {/* â”€â”€ RIGHT COLUMN â”€â”€ */}
          <div className="flex flex-col gap-8 flex-1">
            <GlassCard className="settings-fade sd-2" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SectionHeader title="Integration Quickstart" icon={<Code size={18} />} />
              
              <div className="flex flex-col gap-5 flex-1">
                
                {/* Widget Embed */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Website Widget Snippet</h3>
                  <p style={{ fontSize: 13, color: '#8B847B', marginBottom: 12, lineHeight: 1.5 }}>
                    Copy this snippet just before the closing <code>&lt;/body&gt;</code> tag of your website. It automatically authenticates using your live publishable key.
                  </p>
                  
                  <div className="p-4 rounded-xl transition-all duration-300 relative group" style={{ border: `1px solid ${T.border}`, background: '#EAF8F8', overflowX: 'auto' }}>
                    <code style={{ fontSize: 12, color: '#334155', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`<script src="https://cdn.frosty.com/widget.js" 
  data-key="${revealedKey || (data as any)?.publishable_key_masked || "frosty_live_****************"}">
</script>`}
                    </code>
                    <button onClick={onCopyKey} title="Copy Snippet" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.primary, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Webhook Events */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Available Webhook Events</h3>
                  <p style={{ fontSize: 13, color: '#8B847B', marginBottom: 12, lineHeight: 1.5 }}>
                    Listen to these payloads to sync Frosty activity into your internal CRM or slack.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['lead.created', 'handoff.requested', 'quote.accepted', 'message.received'].map(event => (
                      <span key={event} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(var(--brand-rgb), 0.06)', color: T.primary, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', border: `1px solid rgba(var(--brand-rgb), 0.15)` }}>
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              <div style={{ marginTop: 'auto', paddingTop: 32 }}>
                <Link href="/webhooks" style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#fff', color: T.buttonBg, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.buttonBg; }}
                  >
                    Configure Event Endpoints <ExternalLink size={14} />
                  </button>
                </Link>
              </div>
            </GlassCard>
          </div>

        </div>
      )}
      </EntitlementGate>
    </AppShell>
  );
}
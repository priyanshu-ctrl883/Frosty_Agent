'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Lock, Radio, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';

/** Only events with product emitters (D271). visited/purchased withheld until wired. */
const CAPI_EVENTS = [
  { key: 'qualified', label: 'Lead qualified' },
  { key: 'booked', label: 'Meeting booked' },
  { key: 'accepted', label: 'Quote accepted' },
] as const;

export type MetaCapiSettings = {
  live_sends: boolean;
  dataset_id: string | null;
  has_token: boolean;
  events: string[];
  platform_live_allowed: boolean;
  wired_events?: string[];
};

type MetaCapiEventRow = {
  id: string;
  event_name: string;
  status: string;
  skip_reason: string | null;
  created_at: string;
};

type Props = {
  canConfig: boolean;
  readOnly: boolean;
};

const statusTone = (status: string) => {
  if (status === 'sent') return 'text-emerald-700';
  if (status === 'failed') return 'text-red-700';
  if (status === 'queued') return 'text-amber-700';
  return 'text-muted-foreground';
};

export function MetaCapiSettingsPanel({ canConfig, readOnly }: Props) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [liveSends, setLiveSends] = useState(false);
  const [datasetId, setDatasetId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [events, setEvents] = useState<string[]>(CAPI_EVENTS.map((e) => e.key));
  const [platformLive, setPlatformLive] = useState(false);
  const [recent, setRecent] = useState<MetaCapiEventRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, ev] = await Promise.all([
        apiRequest<MetaCapiSettings>('/v1/meta-capi/settings'),
        apiRequest<MetaCapiEventRow[]>('/v1/meta-capi/events?limit=12').catch(() => []),
      ]);
      setLiveSends(settings.live_sends === true);
      setDatasetId(settings.dataset_id || '');
      setHasToken(settings.has_token === true);
      const wired = settings.wired_events?.length
        ? settings.wired_events
        : CAPI_EVENTS.map((e) => e.key);
      const nextEvents = (Array.isArray(settings.events) ? settings.events : []).filter((k) =>
        wired.includes(k),
      );
      setEvents(nextEvents.length ? nextEvents : [...wired]);
      setPlatformLive(settings.platform_live_allowed === true);
      setRecent(Array.isArray(ev) ? ev : []);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Could not load Meta CAPI settings.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleEvent = (key: string) => {
    setEvents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!canConfig || readOnly) {
      toastError('You do not have permission to update CAPI settings.');
      return;
    }
    if (liveSends && !platformLive) {
      toastError('Platform META_CAPI_LIVE is off. Live sends cannot be enabled until privacy sign-off.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        live_sends: liveSends,
        dataset_id: datasetId.trim() || null,
        events,
      };
      if (accessToken.trim()) {
        body.access_token = accessToken.trim();
      }
      const updated = await apiRequest<MetaCapiSettings>('/v1/meta-capi/settings', {
        method: 'PUT',
        body,
      });
      setLiveSends(updated.live_sends === true);
      setDatasetId(updated.dataset_id || '');
      setHasToken(updated.has_token === true);
      setEvents(updated.events || []);
      setPlatformLive(updated.platform_live_allowed === true);
      setAccessToken('');
      toastSuccess('Meta CAPI settings saved. Live Graph sends remain gated until privacy sign-off.');
      await load();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to save Meta CAPI settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#D9EDEE] p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Radio size={18} className="text-[#0396A6]" />
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Meta Conversions API
            </h2>
            <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20">
              Dual gate · off by default
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Click-to-WhatsApp conversions (`ctwa_clid` required). Events need both the merchant toggle and platform{' '}
            <code className="text-[10px]">META_CAPI_LIVE</code>. See{' '}
            <a href="/privacy#section-6b" className="text-[#0396A6] font-semibold underline">
              Privacy — ad measurement
            </a>
            . Merchant collects end-customer consent outside chat.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${platformLive ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
            <Lock size={12} />
            Platform {platformLive ? 'allows live' : 'blocks live'}
          </span>
        </div>
      </div>

      {!platformLive && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            `META_CAPI_LIVE` is false. Even if you enable the merchant toggle, events are logged as skipped until Product + Legal sign-off and the platform gate is flipped.
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading CAPI settings…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#F7F5F1] border border-[#D9EDEE]">
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-bold text-foreground">Merchant live sends</span>
              <p className="text-xs text-muted-foreground">
                Off by default. Requires dataset ID, access token, and platform gate before Graph posts occur.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={liveSends}
              disabled={!canConfig || readOnly}
              onClick={() => canConfig && !readOnly && setLiveSends(!liveSends)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                liveSends ? 'bg-[#0396A6]' : 'bg-zinc-300'
              } ${!canConfig || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Toggle Meta CAPI live sends"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition ${
                  liveSends ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-foreground">Dataset ID</span>
              <input
                type="text"
                value={datasetId}
                disabled={!canConfig || readOnly}
                onChange={(e) => setDatasetId(e.target.value)}
                placeholder="Meta dataset / pixel ID"
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium disabled:opacity-50"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-foreground">
                Access token {hasToken ? <span className="text-emerald-600">(on file)</span> : null}
              </span>
              <input
                type="password"
                value={accessToken}
                disabled={!canConfig || readOnly}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={hasToken ? '••••••••  (leave blank to keep)' : 'Paste access token'}
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium disabled:opacity-50"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield size={13} /> Events to send (wired only)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Page visited and Purchase are withheld until product emitters exist — they are not shown here.
            </p>
            <div className="flex flex-wrap gap-2">
              {CAPI_EVENTS.map((ev) => {
                const on = events.includes(ev.key);
                return (
                  <button
                    key={ev.key}
                    type="button"
                    disabled={!canConfig || readOnly}
                    onClick={() => toggleEvent(ev.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      on
                        ? 'bg-[#0396A6]/10 text-[#0396A6] border-[#0396A6]/30'
                        : 'bg-muted/40 text-muted-foreground border-border'
                    } disabled:opacity-50`}
                  >
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {canConfig && !readOnly ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="px-4 py-2 rounded-xl bg-[#0396A6] hover:bg-[#0284A6] text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save CAPI settings'}
            </button>
          ) : null}

          <div className="space-y-1.5 pt-2 border-t border-[#EAF2F2]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent event log
            </span>
            {recent.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No CAPI attempts yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="text-[11px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 border border-border/60 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="font-medium text-foreground">{r.event_name}</span>
                    <span className={`capitalize font-semibold ${statusTone(r.status)}`}>
                      {r.status}
                      {r.skip_reason ? (
                        <span className="font-normal text-muted-foreground"> · {r.skip_reason}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

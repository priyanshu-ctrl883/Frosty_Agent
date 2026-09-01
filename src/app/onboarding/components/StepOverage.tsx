'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { OverageSettings } from '@/lib/types';

type Props = {
  onCompleted: () => void;
};

/**
 * Explicit overage opt-in (pricing sheet §2 / D204).
 * Maps to merchant_settings.overage_enabled + overage_cap_inr — already enforced by reserve.
 */
export const StepOverage = ({ onCompleted }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [capInr, setCapInr] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (optIn: boolean) => {
    setBusy(true);
    setError('');
    try {
      const cap = optIn && capInr.trim() ? Number(capInr) : null;
      if (optIn && capInr.trim() && (!Number.isFinite(cap) || (cap as number) < 0)) {
        setError('Enter a valid monthly spend cap in ₹, or leave blank for no cap.');
        setBusy(false);
        return;
      }
      await apiRequest<OverageSettings>('/v1/billing/overage', {
        method: 'PATCH',
        body: {
          overage_enabled: optIn,
          overage_cap_inr: optIn ? cap : null,
        },
      });
      try {
        localStorage.setItem('frosty.onboarding.overage_configured', '1');
      } catch { /* ignore */ }
      onCompleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save overage preference');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111318' }}>
          If you hit your conversation limit
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6B6970', lineHeight: 1.55 }}>
          Choose what happens when your monthly conversation pool is used up. You can change this later in Billing.
        </p>
      </div>

      <label
        style={{
          display: 'flex', gap: 12, padding: 16, borderRadius: 14,
          border: enabled ? '2px solid #336B55' : '1px solid #E8E3F4',
          background: enabled ? '#F0F7F4' : '#fff', cursor: 'pointer',
        }}
      >
        <input
          type="radio"
          name="overage"
          checked={enabled}
          onChange={() => setEnabled(true)}
          style={{ marginTop: 4 }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111318' }}>
            Continue at the extra-conversation rate
          </div>
          <div style={{ fontSize: 13, color: '#6B6970', marginTop: 4, lineHeight: 1.45 }}>
            New conversations keep running and are billed at your plan&apos;s published extra rate,
            until an optional monthly spend cap.
          </div>
        </div>
      </label>

      {enabled ? (
        <div style={{ paddingLeft: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6970' }}>
            Monthly overage spend cap (₹, optional)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={capInr}
            onChange={(e) => setCapInr(e.target.value)}
            placeholder="No cap"
            style={{
              display: 'block', marginTop: 6, width: '100%', maxWidth: 220,
              padding: '10px 12px', borderRadius: 10, border: '1px solid #E3DACD',
              fontSize: 14,
            }}
          />
        </div>
      ) : null}

      <label
        style={{
          display: 'flex', gap: 12, padding: 16, borderRadius: 14,
          border: !enabled ? '2px solid #336B55' : '1px solid #E8E3F4',
          background: !enabled ? '#F0F7F4' : '#fff', cursor: 'pointer',
        }}
      >
        <input
          type="radio"
          name="overage"
          checked={!enabled}
          onChange={() => setEnabled(false)}
          style={{ marginTop: 4 }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111318' }}>
            Finish the current chat, then stop
          </div>
          <div style={{ fontSize: 13, color: '#6B6970', marginTop: 4, lineHeight: 1.45 }}>
            The conversation already in progress can finish. New ones are refused and the visitor
            is offered a human (existing at-capacity handoff).
          </div>
        </div>
      </label>

      {error ? (
        <div style={{ padding: 12, borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => save(enabled)}
        style={{
          alignSelf: 'flex-start',
          padding: '12px 20px',
          borderRadius: 12,
          border: 'none',
          background: '#336B55',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </div>
  );
};

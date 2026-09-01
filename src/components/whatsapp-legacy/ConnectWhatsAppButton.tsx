'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { API_URL as API } from '@/lib/constants';
import { getMetaConfigId, initMetaSdk, META_SDK_SCRIPT_URL } from '@/lib/metaSdk';

interface ConnectWhatsAppButtonProps {
  tenantId: string;
  /** Required for POST /v1/wa/connect (D208) — which agent owns the number. */
  agentId?: string | null;
  configId?: string;
  className?: string;
  buttonText?: string;
}

export default function ConnectWhatsAppButton({
  tenantId,
  agentId = null,
  configId,
  className = "",
  buttonText = "Connect WhatsApp"
}: ConnectWhatsAppButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Manual fallback modal state
  const [showManual, setShowManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualWabaId, setManualWabaId] = useState('');
  const [manualPhoneId, setManualPhoneId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      setSdkLoaded(true);
      return;
    }

    (window as any).fbAsyncInit = function () {
      initMetaSdk((window as any).FB);
      setSdkLoaded(true);
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = META_SDK_SCRIPT_URL;
    js.async = true;
    js.defer = true;
    js.crossOrigin = 'anonymous';
    document.body.appendChild(js);

    return () => {
      if (js.parentNode) js.parentNode.removeChild(js);
    };
  }, []);

  const [autoDetectError, setAutoDetectError] = useState('');

  // ── Async logic extracted here — FB.login callback must be plain/sync ────
  const handleOAuthCode = async (_code: string) => {
    setConnecting(false);
    setAutoDetectError(
      "Embedded Signup cannot finish in this app (no OAuth callback). Enter your Cloud API credentials below — the same POST /v1/wa/connect path as Settings → Meta Connection.",
    );
    setShowManual(true);
  };

  const handleConnect = () => {
    if (!sdkLoaded || !(window as any).FB) {
      alert('Facebook SDK is still loading. Please try again in a moment.');
      return;
    }

    const finalConfigId = configId || getMetaConfigId();
    if (!finalConfigId) {
      console.error('Missing config_id for WhatsApp Embedded Signup.');
      return;
    }

    setConnecting(true);

    // FB.login callback MUST be a plain sync function — async goes in handleOAuthCode
    (window as any).FB.login(
      (response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          if (!code) {
            console.error('No code received from Meta:', response);
            alert('Connection failed: Did not receive an authorization code from Meta.');
            setConnecting(false);
            return;
          }
          handleOAuthCode(code); // fire-and-forget (async)
        } else {
          console.log('User cancelled login or did not fully authorize.');
          setConnecting(false);
        }
      },
      {
        config_id: finalConfigId,
        response_type: 'code',
        override_default_response_type: true,
        auth_type: 'rerequest',
        extras: {
          setup: {}
        }
      }
    );
  };

  const handleManualSave = async () => {
    if (!manualToken || !manualWabaId || !manualPhoneId) {
      alert('Please fill in all three fields.');
      return;
    }
    if (!agentId) {
      alert('Select a WhatsApp agent first — each number is bound to one bot.');
      return;
    }
    setSaving(true);
    try {
      /**
       * Use the existing POST /v1/wa/connect self-serve endpoint.
       * It validates the token against Meta, checks WABA ownership,
       * and requires a published WhatsApp agent.
       */
      const { apiRequest } = await import('@/lib/api');
      await apiRequest('/v1/wa/connect', {
        method: 'POST',
        body: {
          phone_number_id: manualPhoneId.trim(),
          waba_id: manualWabaId.trim(),
          access_token: manualToken.trim(),
          agent_id: agentId,
        },
      });
      alert('Successfully connected WhatsApp Business Account!');
      window.location.reload();
    } catch (err: any) {
      alert('Connection failed: ' + (err?.message || 'Please check your credentials and ensure a published WA agent exists.'));
    }
    setSaving(false);
  };

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#fff',
    fontFamily: 'DM Sans,sans-serif',
    fontSize: 12,
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    marginTop: 4,
    boxSizing: 'border-box',
  };

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={connecting || !sdkLoaded}
        className={`flex items-center justify-center px-4 py-2 text-xs bg-gradient-to-r from-blue-400 to-green-600 text-white font-bold rounded-xl shadow-xs hover:scale-102 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${className}`}
      >
        <span>{connecting ? 'Connecting...' : buttonText}</span>
      </button>

      {/* ── Manual credentials fallback modal ──────────────────────────── */}
      {showManual && (
        <div
          onClick={() => setShowManual(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(4,6,15,0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 100000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(480px, 100%)',
              background: 'linear-gradient(135deg,rgba(37,211,102,0.10),rgba(18,140,126,0.06))',
              border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: 16,
              padding: '24px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle size={20} color="#25D366" />
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                  WhatsApp Manual Setup
                </span>
              </div>
              <button
                onClick={() => setShowManual(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans,sans-serif', marginBottom: 16, lineHeight: 1.6 }}>
              {autoDetectError ? (
                <span style={{ color: '#ef4444', display: 'block', marginBottom: 8, fontWeight: 700 }}>
                  Error: {autoDetectError}
                </span>
              ) : null}
              Auto-detection failed. Get your IDs from{' '}
              <a
                href="https://business.facebook.com/settings/whatsapp-business-accounts"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#25D366', textDecoration: 'underline' }}
              >
                Meta Business Manager → WhatsApp Accounts
              </a>.
              {manualWabaId && (
                <span style={{ color: '#3b82f6' }}> ✓ WABA ID was auto-detected.</span>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Access Token
                </label>
                <input
                  style={inp}
                  placeholder="EAAxxxxxxxxxxxxxxxx…"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  style={inp}
                  placeholder="e.g. 102290828860727"
                  value={manualWabaId}
                  onChange={e => setManualWabaId(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Phone Number ID
                </label>
                <input
                  style={inp}
                  placeholder="e.g. 123456789012345"
                  value={manualPhoneId}
                  onChange={e => setManualPhoneId(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowManual(false)}
                className="px-4 py-2 rounded-xl border border-panel-border bg-transparent text-muted font-bold text-xs hover:text-foreground hover:scale-105 transition-all btn-glow-blue"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSave}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed btn-glow-green ${
                  saving ? 'bg-green-600/40 text-white/50' : 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                }`}
              >
                {saving ? 'Saving…' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

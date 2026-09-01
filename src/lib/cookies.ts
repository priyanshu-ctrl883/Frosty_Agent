/**
 * Frosty Agent — Enterprise GDPR & DPDP Compliant Cookie & Consent Engine (v2)
 */

import { apiRequest } from './api';

export interface CookiePreferences {
  essential: boolean;   // Session, CSRF, security (always true)
  functional: boolean;  // UI docking, volume, audio chimes, local preferences
  analytics: boolean;   // Usage telemetry and error rates
  marketing: boolean;   // Release advisories, model update announcements
}

export interface CookieConsentV2 {
  v: 2;
  status: 'accepted' | 'rejected' | 'custom';
  preferences: CookiePreferences;
  timestamp: string;
  visitorId: string;
  userId?: string;
}

const COOKIE_NAME = 'frosty_consent_v2';
const LEGACY_COOKIE_NAME = 'frosty_cookie_consent';

export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

export const ALL_ACCEPTED_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
};

export const ESSENTIAL_ONLY_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let vid = '';
  try {
    vid = localStorage.getItem('frosty_visitor_id') || '';
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem('frosty_visitor_id', vid);
    }
  } catch {
    vid = 'anonymous_' + Math.random().toString(36).substring(2, 12);
  }
  return vid;
}

export const getCookieConsent = (): CookieConsentV2 | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(COOKIE_NAME + '=')) {
        const val = decodeURIComponent(c.substring(COOKIE_NAME.length + 1));
        const parsed = JSON.parse(val) as CookieConsentV2;
        if (parsed && parsed.v === 2 && parsed.preferences) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse cookie consent', e);
  }
  return null;
};

export const setCookieConsent = async (
  status: 'accepted' | 'rejected' | 'custom',
  preferences: CookiePreferences,
  userId?: string,
  surface: 'dashboard' | 'marketing' | 'widget' = 'dashboard',
): Promise<CookieConsentV2> => {
  const visitorId = getVisitorId();
  const timestamp = new Date().toISOString();

  const finalPreferences: CookiePreferences = {
    ...preferences,
    essential: true, // Always locked to true
  };

  const payload: CookieConsentV2 = {
    v: 2,
    status,
    preferences: finalPreferences,
    timestamp,
    visitorId,
    userId,
  };

  if (typeof window !== 'undefined') {
    // 1. Write Secure Cookie (365 days)
    const d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    const encoded = encodeURIComponent(JSON.stringify(payload));
    document.cookie = `${COOKIE_NAME}=${encoded};${expires};path=/;SameSite=Lax;Secure`;

    // Also mark localStorage flag for fast SSR hydration
    try {
      localStorage.setItem('frosty_consent_saved', '1');
      localStorage.setItem(LEGACY_COOKIE_NAME, JSON.stringify(payload));
    } catch {}

    // 2. Broadcast local event to reactive scripts/hooks
    window.dispatchEvent(
      new CustomEvent('frosty:cookie-consent-updated', {
        detail: payload,
      })
    );

    // 3. Persist to Legal Ledger in PostgreSQL via Backend API
    try {
      await apiRequest('/v1/iam/cookie-consent', {
        method: 'POST',
        body: {
          visitor_id: visitorId,
          surface,
          status,
          preferences: finalPreferences,
          consent_version: 'v2.0',
        },
      });
    } catch (err) {
      // Non-fatal: Local cookie is already authoritative on client
      console.warn('Consent ledger logging completed with fallback:', err);
    }
  }

  return payload;
};

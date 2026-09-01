'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCookieConsent,
  setCookieConsent,
  CookiePreferences,
  CookieConsentV2,
  DEFAULT_PREFERENCES,
} from './cookies';

export function openConsentPreferencesModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('frosty:open-cookie-preferences'));
  }
}

/** Logged-in merchant workspace routes — cookie prefs live in the profile menu instead. */
const MERCHANT_APP_PREFIXES = [
  '/home',
  '/settings',
  '/inbox',
  '/billing',
  '/agents',
  '/analytics',
  '/leads',
  '/meetings',
  '/quotes',
  '/email',
  '/website',
  '/whatsapp',
  '/unified',
  '/knowledge',
  '/integrations',
  '/team',
  '/notifications',
  '/help',
  '/onboarding',
  '/workspace',
  '/profile',
  '/tickets',
  '/conversations',
  '/ecosystem',
  '/activity',
  '/impersonate',
  '/impersonation',
];

export const shouldShowFloatingCookieTrigger = (pathname: string): boolean => {
  if (
    pathname === '/' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/acceptable-use'
  ) {
    return false;
  }
  return !MERCHANT_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

export function useConsentGate() {
  const [consent, setConsent] = useState<CookieConsentV2 | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial read
    const current = getCookieConsent();
    setConsent(current);
    setIsLoaded(true);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentV2>;
      setConsent(customEvent.detail);
    };

    window.addEventListener('frosty:cookie-consent-updated', handleUpdate);
    return () => window.removeEventListener('frosty:cookie-consent-updated', handleUpdate);
  }, []);

  const canTrack = useCallback(
    (category: 'analytics' | 'marketing' | 'functional'): boolean => {
      if (!consent) return false;
      return consent.preferences[category] === true;
    },
    [consent]
  );

  const savePreferences = useCallback(
    async (
      status: 'accepted' | 'rejected' | 'custom',
      preferences: CookiePreferences,
      userId?: string
    ) => {
      const saved = await setCookieConsent(status, preferences, userId);
      setConsent(saved);
      return saved;
    },
    []
  );

  return {
    consent,
    isLoaded,
    hasGivenConsent: consent !== null,
    preferences: consent?.preferences || DEFAULT_PREFERENCES,
    canTrack,
    savePreferences,
    openPreferences: openConsentPreferencesModal,
  };
}

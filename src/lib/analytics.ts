'use client';

import { getCookieConsent } from './cookies';

/**
 * Enterprise Telemetry & Analytics Gate
 * Only activates telemetry if explicit user consent has been granted.
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  const consent = getCookieConsent();
  if (consent?.preferences.analytics) {
    // Insert GA4 / PostHog initialization here
    // e.g. posthog.init(...)
  }

  // React to dynamic consent grants
  window.addEventListener('frosty:cookie-consent-updated', ((e: CustomEvent) => {
    if (e.detail?.preferences?.analytics) {
      // Re-initialize analytics if user just gave consent
    }
  }) as EventListener);
};

export const trackEvent = (name: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  const consent = getCookieConsent();
  if (consent?.preferences.analytics) {
    // Dispatch to tracking engine
  }
};

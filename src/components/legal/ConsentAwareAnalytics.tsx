'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { getCookieConsent } from '@/lib/cookies';

const GTM_ID = 'GTM-NKS36ZB7';
const GA_ID = 'G-BWVRYB60Y4';

/**
 * Conditionally loads Google Tag Manager and Google Analytics ONLY
 * after the user has explicitly granted analytics consent.
 *
 * Mounting this in layout.tsx directly (as GTM / GA components) fires
 * third-party scripts before consent — an illegal act under DPDP 2023,
 * GDPR Art. 6(1)(a), and ePrivacy Directive.
 *
 * This component:
 * 1. Checks the frosty_consent_v2 cookie on mount (SSR-safe).
 * 2. Listens for the frosty:cookie-consent-updated event so it injects
 *    the scripts the moment the user grants consent within the same session.
 */
export function ConsentAwareAnalytics() {
  useEffect(() => {
    const inject = () => {
      const consent = getCookieConsent();
      if (!consent?.preferences?.analytics) return;

      // Guard: don't double-inject
      if (document.getElementById('gtm-script')) return;

      // ── GTM ──────────────────────────────────────────────────────────────
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;
      document.head.appendChild(gtmScript);

      // GTM noscript iframe (body)
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.insertBefore(noscript, document.body.firstChild);

      // ── GA4 ──────────────────────────────────────────────────────────────
      const gaScript1 = document.createElement('script');
      gaScript1.id = 'ga-script';
      gaScript1.async = true;
      gaScript1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(gaScript1);

      const gaScript2 = document.createElement('script');
      gaScript2.id = 'ga-init';
      gaScript2.innerHTML = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied' });
gtag('config', '${GA_ID}', { anonymize_ip: true });`;
      document.head.appendChild(gaScript2);
    };

    // Try on mount (user may have already consented in a prior session)
    inject();

    // Re-try if user grants consent in this session
    const handleConsent = () => inject();
    window.addEventListener('frosty:cookie-consent-updated', handleConsent);
    return () => window.removeEventListener('frosty:cookie-consent-updated', handleConsent);
  }, []);

  /**
   * Consent REVOCATION handler.
   * If analytics/marketing scripts are already loaded and the user REVOKES consent
   * in the same session, signal GTM immediately via the Consent Mode API.
   * This is the industry-standard approach — scripts stay in the DOM but GTM
   * stops forwarding events to analytics/ad vendors.
   */
  useEffect(() => {
    const handleRevoke = (e: Event) => {
      const ev = e as CustomEvent;
      const prefs = ev.detail?.preferences;
      if (!prefs) return;

      // Only act if GTM is already loaded (otherwise nothing to revoke)
      if (!document.getElementById('gtm-script')) return;

      const w = window as any;
      if (typeof w.gtag !== 'function') return;

      w.gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        functionality_storage: prefs.functional ? 'granted' : 'denied',
        personalization_storage: prefs.marketing ? 'granted' : 'denied',
      });
    };

    window.addEventListener('frosty:cookie-consent-updated', handleRevoke);
    return () => window.removeEventListener('frosty:cookie-consent-updated', handleRevoke);
  }, []);

  return null;
}

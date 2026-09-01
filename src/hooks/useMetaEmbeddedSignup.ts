'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  getMetaAppIdFromEnv,
  getMetaConfigIdFromEnv,
  initMetaSdk,
  isMetaEmbeddedSignupConfigured,
  META_SDK_SCRIPT_URL,
} from '@/lib/metaSdk';

type EmbeddedSignupSession = {
  waba_id?: string;
  phone_number_id?: string;
};

type LaunchOptions = {
  agentId: string;
  label?: string;
  onSuccess?: () => void | Promise<void>;
};

const META_ORIGINS = new Set([
  'https://www.facebook.com',
  'https://web.facebook.com',
  'https://facebook.com',
]);

function isHttpsContext() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function useMetaEmbeddedSignup() {
  const [metaAppId, setMetaAppId] = useState(getMetaAppIdFromEnv);
  const [metaConfigId, setMetaConfigId] = useState(getMetaConfigIdFromEnv);
  const [configLoading, setConfigLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionRef = useRef<EmbeddedSignupSession>({});
  const resolveRef = useRef<((value: void) => void) | null>(null);
  const rejectRef = useRef<((reason?: unknown) => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let appId = getMetaAppIdFromEnv();
      let configId = getMetaConfigIdFromEnv();

      const applyConfig = (data?: {
        app_id?: string;
        config_id?: string;
      } | null) => {
        if (data?.app_id) appId = data.app_id.trim();
        if (data?.config_id) configId = data.config_id.trim();
      };

      try {
        const runtimeRes = await fetch('/api/wa/embedded-signup-config', {
          cache: 'no-store',
        });
        if (runtimeRes.ok) {
          applyConfig(await runtimeRes.json());
        }
      } catch {
        // Same-origin route unavailable — try API below.
      }

      if (!isMetaEmbeddedSignupConfigured(appId, configId)) {
        try {
          applyConfig(
            await apiRequest<{
              enabled: boolean;
              app_id: string;
              config_id: string;
            }>('/v1/wa/connect/embedded-signup/config'),
          );
        } catch {
          // Keep env / runtime values if API is down or old.
        }
      }

      if (!cancelled) {
        setMetaAppId(appId);
        setMetaConfigId(configId);
        setConfigLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMetaEmbeddedSignupConfigured(metaAppId, metaConfigId)) return;

    const onMessage = (event: MessageEvent) => {
      if (!META_ORIGINS.has(event.origin)) return;
      if (typeof event.data !== 'string') return;

      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (payload.event === 'FINISH' && payload.data) {
          sessionRef.current = {
            waba_id: payload.data.waba_id || payload.data.wabaId,
            phone_number_id:
              payload.data.phone_number_id || payload.data.phoneNumberId,
          };
        }

        if (payload.event === 'CANCEL') {
          rejectRef.current?.(new Error('Signup cancelled'));
          resolveRef.current = null;
          rejectRef.current = null;
          setIsConnecting(false);
        }
      } catch {
        // Ignore unrelated postMessage payloads.
      }
    };

    window.addEventListener('message', onMessage);

    const bootSdk = () => {
      initMetaSdk((window as any).FB, metaAppId);
      setSdkReady(true);
    };

    if ((window as any).FB) {
      bootSdk();
      return () => window.removeEventListener('message', onMessage);
    }

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      const timer = window.setInterval(() => {
        if ((window as any).FB) {
          bootSdk();
          window.clearInterval(timer);
        }
      }, 200);
      return () => {
        window.clearInterval(timer);
        window.removeEventListener('message', onMessage);
      };
    }

    (window as any).fbAsyncInit = bootSdk;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = META_SDK_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    return () => window.removeEventListener('message', onMessage);
  }, [metaAppId, metaConfigId]);

  const finishSignup = useCallback(async (code: string, options: LaunchOptions) => {
    const session = sessionRef.current;
    const wabaId = session.waba_id?.trim();
    const phoneNumberId = session.phone_number_id?.trim();

    if (!wabaId || !phoneNumberId) {
      throw new Error(
        'Meta did not return your WABA ID and phone number ID. Try again or enter credentials manually.',
      );
    }

    await apiRequest('/v1/wa/connect/embedded-signup', {
      method: 'POST',
      body: {
        code,
        agent_id: options.agentId,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        label: options.label?.trim() || undefined,
      },
    });

    sessionRef.current = {};
    await options.onSuccess?.();
  }, []);

  const launchEmbeddedSignup = useCallback(
    (options: LaunchOptions) =>
      new Promise<void>((resolve, reject) => {
        if (!isMetaEmbeddedSignupConfigured(metaAppId, metaConfigId)) {
          reject(
            new Error(
              'Meta Embedded Signup is not configured. Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_CONFIG_ID.',
            ),
          );
          return;
        }

        if (!isHttpsContext()) {
          reject(
            new Error(
              'Meta Embedded Signup requires HTTPS. Use an HTTPS tunnel (for example ngrok) instead of http://localhost.',
            ),
          );
          return;
        }

        if (!sdkReady || !(window as any).FB) {
          reject(new Error('Meta SDK is still loading. Please try again in a moment.'));
          return;
        }

        sessionRef.current = {};
        resolveRef.current = resolve;
        rejectRef.current = reject;
        setIsConnecting(true);

        (window as any).FB.login(
          (response: { authResponse?: { code?: string } }) => {
            const code = response.authResponse?.code;
            if (!code) {
              reject(new Error('Signup cancelled'));
              resolveRef.current = null;
              rejectRef.current = null;
              setIsConnecting(false);
              return;
            }

            void finishSignup(code, options)
              .then(() => {
                resolveRef.current?.();
                resolveRef.current = null;
                rejectRef.current = null;
              })
              .catch((err: unknown) => {
                rejectRef.current?.(err);
                resolveRef.current = null;
                rejectRef.current = null;
              })
              .finally(() => setIsConnecting(false));
          },
          {
            config_id: metaConfigId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: '',
              sessionInfoVersion: '3',
            },
          },
        );
      }),
    [finishSignup, metaAppId, metaConfigId, sdkReady],
  );

  const isConfigured = isMetaEmbeddedSignupConfigured(metaAppId, metaConfigId);

  return {
    sdkReady,
    configLoading,
    isConnecting,
    isConfigured,
    requiresHttps: typeof window !== 'undefined' && !isHttpsContext(),
    launchEmbeddedSignup,
  };
}

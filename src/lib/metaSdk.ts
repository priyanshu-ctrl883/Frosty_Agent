export const META_SDK_VERSION = 'v26.0';
export const META_SDK_SCRIPT_URL = 'https://connect.facebook.net/en_US/sdk.js';

/** Frosty Agent Meta app — Embedded Signup (public ids, safe in client bundle). */
export const FROSTY_META_APP_ID = '4348632945374978';
export const FROSTY_META_EMBEDDED_CONFIG_ID = '1061344189819875';

export function getMetaAppIdFromEnv(): string {
  return process.env.NEXT_PUBLIC_META_APP_ID?.trim() || FROSTY_META_APP_ID;
}

export function getMetaConfigIdFromEnv(): string {
  return process.env.NEXT_PUBLIC_META_CONFIG_ID?.trim() || FROSTY_META_EMBEDDED_CONFIG_ID;
}

export function isMetaEmbeddedSignupConfigured(appId: string, configId: string): boolean {
  return Boolean(appId.trim() && configId.trim());
}

export function initMetaSdk(
  FB: { init: (options: Record<string, unknown>) => void },
  appId: string,
) {
  FB.init({
    appId: appId.trim(),
    autoLogAppEvents: true,
    xfbml: true,
    cookie: true,
    version: META_SDK_VERSION,
  });
}

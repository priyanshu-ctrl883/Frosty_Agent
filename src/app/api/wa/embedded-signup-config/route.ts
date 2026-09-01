import { NextResponse } from 'next/server';
import {
  FROSTY_META_APP_ID,
  FROSTY_META_EMBEDDED_CONFIG_ID,
  getMetaAppIdFromEnv,
  getMetaConfigIdFromEnv,
} from '@/lib/metaSdk';

/** Runtime Meta Embedded Signup ids — env overrides, then hardcoded Frosty defaults. */
export function GET() {
  const appId = (
    process.env.META_APP_ID?.trim() ||
    getMetaAppIdFromEnv() ||
    FROSTY_META_APP_ID
  ).trim();
  const configId = (
    process.env.META_EMBEDDED_CONFIG_ID?.trim() ||
    getMetaConfigIdFromEnv() ||
    FROSTY_META_EMBEDDED_CONFIG_ID
  ).trim();

  return NextResponse.json({
    enabled: Boolean(appId && configId),
    app_id: appId,
    config_id: configId,
  });
}

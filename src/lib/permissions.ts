/**
 * Merchant permission codes — the ones the API actually enforces.
 *
 * ⚠️ THESE ARE NOT THE CODES IN THE MASTER'S PROSE, AND NOT THE CODES IN THE PARALLEL BUILD'S NAV.
 * The Master's §"Permission codes (Phase 1 catalog)" names `analytics:read`, `channels:wa`,
 * `meetings:config`, `quotes:config`, `quotes:approve` and `inbox:presence`. **None of those exist
 * in `tenant_admin.permissions`.** Ours splits read from write instead (`meetings:view` /
 * `meetings:manage`, `quotations:view` / `quotations:send`, `inbox:read` / `inbox:reply`) and calls
 * the dashboard-read code `dashboard:view`.
 *
 * The parallel build's `nav.ts` gates on the doc's spelling, so four of its eighteen items would
 * have been invisible to every role forever — the D44c failure, in the other dashboard. The list
 * below is the DATABASE's, and `test_merchant_dashboard_api_contract.py` asserts that, because a
 * TypeScript union is only as good as the vocabulary behind it.
 */

export const MERCHANT_PERMISSIONS = [
  "agent:config",
  "billing:view",
  "billing:manage",
  "catalog:read",
  "catalog:write",
  "dashboard:view",
  "handoff:manage",
  "inbox:read",
  "inbox:reply",
  "kb:view",
  "kb:edit",
  "leads:read",
  "leads:write",
  "meetings:view",
  "meetings:manage",
  "quotations:view",
  "quotations:send",
  "team:manage",
  "webhooks:manage",
  "widget:config",
] as const;

export type MerchantPermission = (typeof MERCHANT_PERMISSIONS)[number];

/** True when the holder has ANY of the listed codes. Empty grant = false, always. */
export function can(
  permissions: string[] | undefined | null,
  code: MerchantPermission | MerchantPermission[],
): boolean {
  if (!permissions || permissions.length === 0) return false;
  const granted = new Set(permissions);
  const need = Array.isArray(code) ? code : [code];
  return need.some((c) => granted.has(c));
}

/** True only when the holder has EVERY listed code — for a screen that reads two surfaces. */
export function canAll(
  permissions: string[] | undefined | null,
  codes: MerchantPermission[],
): boolean {
  if (!permissions || permissions.length === 0) return false;
  const granted = new Set(permissions);
  return codes.every((c) => granted.has(c));
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  agent: "Agent",
  viewer: "Viewer",
};

/** A display label for the role pill. Unknown roles show their raw name, never a guess. */
export function roleLabel(roleName: string | null, isOwner: boolean): string {
  if (isOwner) return "Owner";
  if (roleName && ROLE_LABELS[roleName]) return ROLE_LABELS[roleName] as string;
  return roleName || "No role";
}

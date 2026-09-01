"use client";

import { apiRequest } from "@/lib/api";
import type { BootstrapResult, BootstrapResume, Me } from "@/lib/types";

const KEY = "frosty.pendingSignup";

export type PendingSignup = {
  email: string;
  company_name: string;
  first_name?: string;
  last_name?: string;
};

export const savePendingSignup = (
  email: string,
  company_name: string,
  first_name?: string,
  last_name?: string,
): void => {
  if (typeof window === "undefined") return;
  const payload: PendingSignup = {
    email: email.trim().toLowerCase(),
    company_name: company_name.trim(),
  };
  if (first_name?.trim()) payload.first_name = first_name.trim();
  if (last_name?.trim()) payload.last_name = last_name.trim();
  sessionStorage.setItem(KEY, JSON.stringify(payload));
};

export const readPendingSignup = (): PendingSignup | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (!parsed?.email || !parsed?.company_name) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingSignup = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
};

/**
 * After a session exists: attach a merchant if signup was interrupted by email confirm.
 *
 * Order: already a member → sessionStorage company name (this device) → staged resume
 * (other device / confirm link) → caller must collect a company name.
 */
export const provisionMerchantIfNeeded = async (
  token?: string,
): Promise<"home" | "onboarding" | "needs_company"> => {
  const me = await apiRequest<Me>("/v1/me", { token });
  if (me.active_merchant_id) {
    clearPendingSignup();
    return "home";
  }

  const pending = readPendingSignup();
  if (pending?.company_name) {
    try {
      await apiRequest<BootstrapResult>("/v1/iam/bootstrap", {
        method: "POST",
        body: {
          company_name: pending.company_name,
          ...(pending.first_name ? { first_name: pending.first_name } : {}),
          ...(pending.last_name ? { last_name: pending.last_name } : {}),
        },
        token,
      });
      clearPendingSignup();
      return "onboarding";
    } catch {
      // Resume may still hold the staged name.
    }
  }

  try {
    const resumed = await apiRequest<BootstrapResume>("/v1/iam/bootstrap/resume", {
      method: "POST",
      token,
    });
    if (resumed.resumed) {
      clearPendingSignup();
      return "onboarding";
    }
  } catch {
    // Fall through — collect the name on /signup/google.
  }

  return "needs_company";
};

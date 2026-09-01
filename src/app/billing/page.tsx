"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ErrorBox, Loading } from "@/components/ui/PageState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ApiClientError, apiPage, apiRequest } from "@/lib/api";
import { dateOnly, dateTime, inr, money } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { AddonCheckoutResult, LedgerEntry, Plan, Subscription, SubscribeResult, TaxInvoice, TopupResult, Wallet } from "@/lib/types";
import type { BillingConfig, OverageSettings, SeatsInfo } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import {
  markBillingProcessing,
  isBillingProcessing,
  clearBillingProcessing,
  peekAssistedSetupUrl,
  subscribeWithSetupChoice,
  openRazorpayCheckout,
  openSubscriptionCheckout,
} from "@/lib/billingCheckout";
import { subscriptionCheckoutContext } from "@/lib/planPricing";
import { refreshFrostySessionCookie } from "@/lib/session";
import { SetupChoice, needsSetupChoice, type SetupPath } from "@/components/billing/SetupChoice";
import { PaymentMethodsSection } from "@/components/billing/PaymentMethodsSection";
import { trialAutopayStatusLine } from "@/lib/onboardingBilling";
import { 
  CreditCard, RefreshCw, AlertTriangle, ShieldCheck, 
  Globe, MessageSquare, Zap, Sparkles, Check,
  ArrowUpRight, ArrowRight, Calendar, Loader2, Mail, AlertOctagon, Lock
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import styles from "./billing.module.css";
import { DASHBOARD_BILLING_CYCLES } from "@/lib/corePlans";
import { catalogTermTotal } from "@/lib/planPricing";
import {
  cancelActionLabel,
  cancelSectionDescription,
  subscriptionCancelUi,
} from "@/lib/subscriptionCancel";

/** Live Razorpay sub on file — subscribe must not be offered again (D28 / D173). */
function hasOpenCheckout(sub: Subscription | null | undefined): boolean {
  return Boolean(sub?.razorpay_subscription_id && sub.status !== "cancelled");
}

function isPendingPayment(sub: Subscription | null | undefined): boolean {
  return Boolean(
    sub && (sub.status === "pending_subscribe" || sub.autopay_state === "pending_mandate")
  );
}

type BillingCycle = "monthly" | "quarterly" | "semi_annual" | "annual";
const TERM_MONTHS: Record<BillingCycle, number> = {
  monthly: 1, quarterly: 3, semi_annual: 6, annual: 12,
};

function subscribeErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.code === "subscription_exists") {
      return "A subscription is already in progress. Complete the pending payment, or cancel it before choosing a different plan.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Could not start that subscription";
}

export default function BillingPage() {
  const { me, entitlements, reload } = useWorkspace();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("1000");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [guaranteeData, setGuaranteeData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponNotice, setCouponNotice] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount_type: string; discount_value: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);
  const [setupPath, setSetupPath] = useState<SetupPath | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [assistedSetupUrl, setAssistedSetupUrl] = useState<string | null>(null);
  // ─── Billing config 0095 new state ────────────────────────────────────────
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);
  const [overageSettings, setOverageSettings] = useState<OverageSettings | null>(null);
  const [seatsInfo, setSeatsInfo] = useState<SeatsInfo | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [invoiceCursor, setInvoiceCursor] = useState<string | null>(null);
  const [overageToggleBusy, setOverageToggleBusy] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const checkoutContextFor = useCallback(
    (planSlug: string) => {
      const plan = plans.find((p) => p.slug === planSlug);
      if (!plan) return undefined;
      return subscriptionCheckoutContext(plan, billingCycle);
    },
    [plans, billingCycle],
  );


  const canManage = can(me?.permissions, "billing:manage");

  const load = useCallback(async () => {
    setError(null);
    const [walletRes, plansRes] = await Promise.allSettled([
      apiRequest<Wallet>("/v1/billing/wallet"),
      apiRequest<unknown>("/v1/billing/plans"),
    ]);
    if (walletRes.status === "fulfilled") {
      setWallet(walletRes.value);
    } else {
      setError(walletRes.reason instanceof Error ? walletRes.reason.message : "Could not load your billing information");
    }
    if (plansRes.status === "fulfilled") {
      const pRes = plansRes.value as Plan[] | { data?: Plan[] };
      const planList = Array.isArray(pRes) ? pRes : (pRes?.data || []);
      setPlans(planList);
    } else {
      setPlans([]);
      if (walletRes.status === "fulfilled") {
        setError("Plan catalog could not be loaded. Retry before starting checkout — prices come from the server.");
      }
    }
    
    try {
      setSubscription(await apiRequest<Subscription>("/v1/billing/subscription"));
    } catch {
      setSubscription(null);
    }

    try {
      const page = await apiPage<LedgerEntry[]>("/v1/billing/ledger?limit=25");
      setLedger(page.data || []);
      setCursor(page.meta.next_cursor ?? null);
    } catch {
      setLedger([]);
      setCursor(null);
    }

    // ─── Billing config 0095 supplemental calls ────────────────────────────
    // These are non-fatal: if they fail the page still shows core billing info.
    try { setBillingConfig(await apiRequest<BillingConfig>("/v1/billing/config")); } catch { /* optional */ }
    try { setOverageSettings(await apiRequest<OverageSettings>("/v1/billing/overage")); } catch { /* optional */ }
    try { setSeatsInfo(await apiRequest<SeatsInfo>("/v1/billing/seats")); } catch { /* optional */ }
    try {
      const inv = await apiRequest<TaxInvoice[] | { data?: TaxInvoice[]; meta?: { next_cursor?: string } }>("/v1/billing/invoices");
      if (Array.isArray(inv)) {
        setInvoices(inv);
        setInvoiceCursor(null);
      } else {
        setInvoices(inv?.data || []);
        setInvoiceCursor(inv?.meta?.next_cursor ?? null);
      }
    } catch {
      setInvoices([]);
      setInvoiceCursor(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;
    void (async () => {
      await refreshFrostySessionCookie();
      const noticeByKind: Record<string, string> = {
        done: "Payment submitted. This page updates when Razorpay confirms the subscription.",
        addon: "Add-on payment submitted. Your purchase activates when Razorpay confirms.",
        topup: "Top-up payment submitted. Credits appear when Razorpay confirms.",
        setup: "Setup fee payment submitted. We will confirm once Razorpay clears it.",
      };
      setNotice(noticeByKind[checkout] ?? "Payment submitted. We will update this page when Razorpay confirms.");
      markBillingProcessing();
      await Promise.all([load(), reload()]);
      window.history.replaceState({}, "", "/billing");
    })();
  }, [load, reload]);

  // ─── Real-time UI Updates ──────────────────────────────────────────────
  // Polls wallet and ledger in the background so credits update live during chat testing.
  useEffect(() => {
    let cancelled = false;
    const pollLiveStats = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const [w, lPage, cfg] = await Promise.all([
          apiRequest<Wallet>("/v1/billing/wallet"),
          apiPage<LedgerEntry[]>("/v1/billing/ledger?limit=25").catch(() => null),
          apiRequest<BillingConfig>("/v1/billing/config").catch(() => null),
        ]);
        if (cancelled) return;
        if (w) setWallet(w);
        if (lPage?.data) {
          setLedger(lPage.data);
          setCursor(lPage.meta?.next_cursor ?? null);
        }
        if (cfg) setBillingConfig(cfg);
      } catch {
        /* silent on background poll */
      }
    };

    const pollInterval = window.setInterval(() => {
      void pollLiveStats();
    }, 3000);

    const onFocusOrVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void pollLiveStats();
        void reload();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      cancelled = true;
      window.clearInterval(pollInterval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [reload]);

  useEffect(() => {
    setProcessingPayment(isBillingProcessing());
    setAssistedSetupUrl(peekAssistedSetupUrl());
  }, []);

  useEffect(() => {
    if (!processingPayment) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const sub = await apiRequest<Subscription>("/v1/billing/subscription");
        if (cancelled) return;
        setSubscription(sub);
        if (sub.status === "active" || sub.status === "past_due" || sub.status === "grace" || sub.status === "trialing") {
          clearBillingProcessing();
          setProcessingPayment(false);
          await reload();
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [processingPayment, reload]);

  async function loadMore() {
    if (!cursor) return;
    setBusyAction('ledger');
    try {
      const more = await apiPage<LedgerEntry[]>(`/v1/billing/ledger?limit=25&cursor=${cursor}`);
      setLedger((l) => [...l, ...(more.data || [])]);
      setCursor(more.meta.next_cursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more transactions");
    } finally {
      setBusyAction(null);
    }
  }

  async function loadMoreInvoices() {
    if (!invoiceCursor) return;
    setBusyAction('invoices');
    try {
      const more = await apiPage<TaxInvoice[]>(`/v1/billing/invoices?limit=10&cursor=${invoiceCursor}`);
      setInvoices((prev) => [...prev, ...(more.data || [])]);
      setInvoiceCursor(more.meta.next_cursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more invoices");
    } finally {
      setBusyAction(null);
    }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponNotice(null);
    try {
      const res = await apiRequest<any>(`/v1/billing/coupons/${couponCode.trim()}`);
      let desc = "";
      if (res.discount_type === "fixed_amount") desc = `Flat ₹${res.discount_value} off`;
      else if (res.discount_type === "percentage") desc = `${res.discount_value}% off`;
      else if (res.discount_type === "credits") desc = `${res.discount_value} free credits`;
      
      setCouponNotice({ type: 'success', message: `Valid! ${desc} will be applied at checkout.` });
      setAppliedCoupon({ discount_type: res.discount_type, discount_value: Number(res.discount_value) });
    } catch (err) {
      setCouponNotice({ type: 'error', message: err instanceof Error ? err.message : "Invalid coupon" });
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function subscribe(planSlug: string) {
    if (isPendingPayment(subscription)) {
      setNotice(null);
      setError(null);
      await resumeCheckout();
      return;
    }
    const plan = plans.find((p) => p.slug === planSlug);
    if (plan && needsSetupChoice(plan) && !setupPath) {
      setSelectedPlanSlug(planSlug);
      setError("Choose self-serve or assisted setup before continuing.");
      return;
    }
    setBusyAction(`subscribe-${planSlug}`);
    setError(null);
    setNotice(null);
    try {
      if (subscription && subscription.status !== "cancelled" && subscription.status !== "trialing") {
        const out = await apiRequest<{ short_url: string | null; effective_at: string | null; razorpay_subscription_id?: string | null }>("/v1/billing/plan-change", {
          method: "POST",
          body: { plan_slug: planSlug, billing_cycle: billingCycle },
        });
        if (out.effective_at) {
          setNotice(`Plan change scheduled successfully. It will take effect on ${out.effective_at}.`);
        } else if (out.razorpay_subscription_id) {
          markBillingProcessing();
          setProcessingPayment(true);
          setNotice(
            "Opening autopay setup. Razorpay charges a refundable ₹5 now to verify your payment method; your plan is billed after the 7-day trial.",
          );
          openSubscriptionCheckout(out.razorpay_subscription_id, checkoutContextFor(planSlug));
        } else if (out.short_url) {
          markBillingProcessing();
          setProcessingPayment(true);
          setNotice("Opening Razorpay payment checkout for your new plan...");
          openRazorpayCheckout(out.short_url);
        } else {
          setNotice("Plan updated successfully!");
        }
      } else {
        const { assistedUrl } = await subscribeWithSetupChoice({
          planSlug,
          billingCycle,
          couponCode: couponCode,
          setupPath: plan && needsSetupChoice(plan) ? setupPath : null,
          checkoutContext: checkoutContextFor(planSlug),
        });
        setProcessingPayment(true);
        if (assistedUrl) setAssistedSetupUrl(assistedUrl);
        setNotice(
          assistedUrl
            ? "Opening autopay setup (refundable ₹5 verification). After mandate confirmation, complete assisted setup if prompted."
            : "Opening autopay setup. Razorpay charges a refundable ₹5 now to verify your payment method; your plan is billed after the 7-day trial.",
        );
      }
      await load();
      reload();
    } catch (err) {
      setError(subscribeErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function resumeCheckout() {
    setBusyAction('resume');
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<SubscribeResult>("/v1/billing/subscription/resume", {
        method: "POST",
      });
      setNotice(
        "Opening autopay setup. Razorpay charges a refundable ₹5 now to verify your payment method; your plan is billed after the 7-day trial.",
      );
      if (out?.razorpay_subscription_id) {
        const ctx =
          subscription?.plan_slug && plans.length
            ? checkoutContextFor(subscription.plan_slug)
            : undefined;
        openSubscriptionCheckout(out.razorpay_subscription_id, ctx);
      } else if (out?.short_url) {
        openRazorpayCheckout(out.short_url);
      }
      await load();
      await reload();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not reopen the payment checkout",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function topup(e?: FormEvent) {
    if (e) e.preventDefault();
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setBusyAction('topup');
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<TopupResult>("/v1/billing/topups", {
        method: "POST",
        body: { amount_inr: amount },
      });
      setNotice(
        `Opening payment gateway for ${inr(amount)} — ${out.credits} credits once payment clears.`,
      );
      if (out?.short_url) {
        openRazorpayCheckout(out.short_url);
      }
      await load();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start that top-up");
    } finally {
      setBusyAction(null);
    }
  }

  async function requestAssistedSetup() {
    setBusyAction('setupFee');
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<{ payment_link_id: string; short_url: string; already_requested: boolean }>("/v1/billing/setup-fee/request-assisted", {
        method: "POST",
      });
      if (out.already_requested) {
        setNotice("You have already requested assisted setup. Redirecting to payment link...");
      }
      setTimeout(() => {
        window.location.href = out.short_url;
      }, out.already_requested ? 2000 : 0);
    } catch (e: any) {
      setError(e.message || "Failed to request assisted setup.");
      setBusyAction(null);
    }
  }

  async function handleAddChannel(channelType: 'website' | 'whatsapp') {
    setBusyAction(`addon-${channelType}`);
    setError(null);
    setNotice(null);
    const channelPrice =
      entitlements?.tax_treatment === "export"
        ? (billingConfig?.extra_channel_price_usd ? `$${billingConfig.extra_channel_price_usd}` : "$85")
        : (billingConfig?.extra_channel_price_inr
            ? `₹${Number(billingConfig.extra_channel_price_inr).toLocaleString("en-IN")}`
            : "₹2,999");
    try {
      const addon_type = channelType === "website" ? "extra_web_channel" : "extra_wa_channel";
      const out = await apiRequest<AddonCheckoutResult>("/v1/billing/addons/checkout", {
        method: "POST",
        body: { addon_type },
      });
      markBillingProcessing();
      setNotice(
        `Opening checkout for Additional ${channelType === "website" ? "Website" : "WhatsApp"} (${channelPrice} + GST). Activates when payment clears.`,
      );
      if (out?.short_url) {
        openRazorpayCheckout(out.short_url);
      }
      await load();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start channel add-on purchase");
    } finally {
      setBusyAction(null);
    }
  }

  async function purchaseExtraSeat() {
    setBusyAction('purchaseSeat');
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<{ short_url: string }>("/v1/billing/addons/checkout", {
        method: "POST",
        body: { addon_type: "extra_team_seat" },
      });
      if (out.short_url) {
        setNotice("Opening payment portal to add an extra team seat...");
        openRazorpayCheckout(out.short_url);
      }
      await load();
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not initiate seat purchase");
    } finally {
      setBusyAction(null);
    }
  }



  async function openCancelModal() {
    if (isPendingPayment(subscription)) {
      setGuaranteeData(null);
      setShowCancelModal(true);
      return;
    }
    setBusyAction('cancel');
    try {
      const out = await apiRequest<any>("/v1/billing/subscription/guarantee-status");
      if (out.eligible) {
        setGuaranteeData(out.refund_calculation);
      } else {
        setGuaranteeData(null);
      }
      setShowCancelModal(true);
    } catch (e) {
      setGuaranteeData(null);
      setShowCancelModal(true);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCancelSubscription() {
    setBusyAction('cancel');
    setError(null);
    const wasPending = isPendingPayment(subscription);
    try {
      let path = "/v1/billing/subscription/cancel";
      if (wasPending) {
         path = "/v1/billing/subscription/abandon-checkout";
      } else if (guaranteeData) {
         path = "/v1/billing/subscription/cancel-with-guarantee";
      }
      
      const out = await apiRequest<{ status: string; cancel_at: string | null; message?: string }>(path, {
        method: "POST",
      });
      setNotice(
        wasPending
          ? "Pending checkout cancelled. You can choose a plan again."
          : guaranteeData 
            ? out.message || "Cancellation request submitted and pending approval."
            : out.cancel_at
              ? `Subscription cancelled. Your agents keep answering until ${dateTime(out.cancel_at)}.`
              : "Cancellation successfully recorded.",
      );
      await load();
      await reload();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "step_up_required") {
        setError(
          "Confirm it’s you to cancel a paid subscription: sign out, sign back in with your authenticator app, then try again.",
        );
      } else if (err instanceof ApiClientError && err.code === "subscription_not_cancellable") {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Could not cancel subscription");
      }
    } finally {
      setBusyAction(null);
      setShowCancelModal(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Billing" requires="billing:view">
        <div className="pt-2">
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }

  const usedThisPeriod = wallet ? Number(wallet.credits_used_this_period) : 0;
  
  const currentPlan = plans.find((p) => p.slug === subscription?.plan_slug);
  const planName = currentPlan?.name || entitlements?.plan_name || (subscription?.plan_slug ? subscription.plan_slug.charAt(0).toUpperCase() + subscription.plan_slug.slice(1) : "Growth");

  const included = entitlements?.limits?.max_conversations_per_month || currentPlan?.included_conversations;
  const quotaBase = included && included > 0 ? included : (currentPlan?.slug === "scale" ? 1600 : currentPlan?.slug === "growth" ? 600 : 300);
  
  const usedPct = quotaBase ? (usedThisPeriod >= quotaBase ? 100 : Math.min(99, Math.floor((usedThisPeriod / quotaBase) * 100))) : 0;
  const remainingInPool = Math.max(0, quotaBase - usedThisPeriod);
  const overageConvos = Math.max(0, usedThisPeriod - quotaBase);
  const overageRate = Number(currentPlan?.overage_rate ?? currentPlan?.overage_rate_inr ?? 0);
  const accruedOverage = wallet?.overage_spend_inr != null ? Number(wallet.overage_spend_inr) : NaN;
  const estOverageAmount = Number.isFinite(accruedOverage)
    ? accruedOverage
    : (overageRate > 0 ? overageConvos * overageRate : 0);

  const rawSubStatus = (subscription?.status || entitlements?.subscription_status || "active").toLowerCase();
  const subStatus = rawSubStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const planEnded = rawSubStatus === "cancelled" || rawSubStatus === "suspended";
  const planLive = !planEnded && rawSubStatus !== "trialing";
  const setupFeePaid = Boolean(subscription?.setup_fee_paid ?? entitlements?.setup_fee_paid ?? true);
  const pendingPayment = isPendingPayment(subscription);
  const openCheckout = hasOpenCheckout(subscription);

  const statusTone =
    rawSubStatus === "active"
      ? { bg: "#DCFCE7", border: "#BBF7D0", text: "#166534", dot: "#22C55E" }
      : rawSubStatus === "cancelled" || rawSubStatus === "suspended"
        ? { bg: "#FEE2E2", border: "#FECACA", text: "#991B1B", dot: "#EF4444" }
        : rawSubStatus === "past_due"
          ? { bg: "#FFE4E6", border: "#FECDD3", text: "#9F1239", dot: "#E11D48" }
          : rawSubStatus === "trialing"
            ? { bg: "#FEF3C7", border: "#FDE68A", text: "#92400E", dot: "#F59E0B" }
            : { bg: "#FEF3C7", border: "#FDE68A", text: "#92400E", dot: "#F59E0B" };

  const websiteOwned =
    entitlements?.limits?.max_website_channels ??
    entitlements?.limits?.max_web_channels ??
    1;
  const whatsappOwned =
    entitlements?.limits?.max_whatsapp_channels ??
    entitlements?.limits?.max_whatsapp_numbers ??
    1;
  const websiteInUse = entitlements?.limit_usage?.max_web_channels;
  const whatsappInUse = entitlements?.limit_usage?.max_whatsapp_numbers;
  const websiteAgentNames = entitlements?.channel_limit_agents?.max_web_channels ?? [];
  const whatsappAgentNames = entitlements?.channel_limit_agents?.max_whatsapp_numbers ?? [];
  const websiteExtras = Math.max(0, websiteOwned - 1);
  const whatsappExtras = Math.max(0, whatsappOwned - 1);

  const extraChannelPriceLabel =
    entitlements?.tax_treatment === "export"
      ? (billingConfig?.extra_channel_price_usd ? `$${billingConfig.extra_channel_price_usd}` : "$85")
      : (billingConfig?.extra_channel_price_inr
          ? `₹${Number(billingConfig.extra_channel_price_inr).toLocaleString("en-IN")}`
          : "₹2,999");

  const PLAN_ORDER: Record<string, number> = { starter: 0, growth: 1, scale: 2, max: 3, enterprise: 4 };
  // D214: this phase is Core (+ enterprise) only. Commerce is seeded (0113) but not sold in UI.
  const displayPlans = [...plans]
    .filter((p) => ["starter", "growth", "scale", "max", "enterprise"].includes(p.slug))
    .sort((a, b) => (PLAN_ORDER[a.slug] ?? 99) - (PLAN_ORDER[b.slug] ?? 99));
  const priceCurrency: "INR" | "USD" =
    entitlements?.tax_treatment === "export" || displayPlans[0]?.currency === "USD" ? "USD" : "INR";

  const cancelUi = subscriptionCancelUi(subscription, billingConfig, canManage);
  const cancelDescription = cancelUi.scheduledEnd
    ? `Your subscription is scheduled to end on ${dateTime(cancelUi.scheduledEnd)}. Agents keep answering until then, then stop.`
    : cancelSectionDescription(cancelUi);

  return (
    <AppShell
      title="Billing"
      requires="billing:view"
      actions={
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => {
              void load();
              reload();
            }}
            disabled={loading || Boolean(busyAction)}
            className={styles.refreshBtn}
            title="Refresh billing data"
          >
            <RefreshCw size={14} className={loading || busyAction ? "animate-spin text-[#0396A6]" : "text-[#64748B]"} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className={styles.pageContainer}>
        
        {error ? (
          <ErrorBox
            message={error}
            onRetry={
              pendingPayment
                ? () => void resumeCheckout()
                : () => {
                    setError(null);
                    void load();
                  }
            }
          />
        ) : null}

        {notice ? (
          <div className={styles.noticeBanner}>
            {notice}
          </div>
        ) : null}

        {processingPayment ? (
          <div className={styles.pendingBanner}>
            <div>
              <strong style={{ color: "#92400E" }}>Payment received — activating…</strong>
              <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 500, color: "#B45309" }}>
                Waiting for confirmation from the payment provider. This usually takes a few seconds.{" "}
                <button type="button" onClick={() => { void load(); reload(); }} style={{ textDecoration: "underline", background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700 }}>
                  Refresh now
                </button>
              </p>
            </div>
          </div>
        ) : null}

        {assistedSetupUrl ? (
          <div className={styles.noticeBanner}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Assisted setup fee ready</strong>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500 }}>
              You chose Frostrek-assisted onboarding. Complete the one-time setup payment when ready.
            </p>
            <Button type="button" onClick={() => window.open(assistedSetupUrl, "_blank", "noopener,noreferrer")}>
              Pay setup fee
            </Button>
          </div>
        ) : null}

        {pendingPayment && canManage ? (
          <div className={styles.pendingBanner}>
            <div className={styles.pendingContent}>
              <AlertTriangle size={18} color="#B45309" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                  Payment pending for {planName}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#A16207', lineHeight: 1.45 }}>
                  Your checkout was started but not completed. Finish payment to activate this plan —
                  choosing another plan is blocked until you complete or cancel.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => void resumeCheckout()}
              className={styles.completePayBtn}
            >
              Complete payment
            </button>
            {cancelUi.canCancel && cancelUi.kind === "pending" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={Boolean(busyAction)}
                onClick={openCancelModal}
                style={{ fontSize: 12, color: "#DC2626", marginLeft: 8 }}
              >
                {busyAction === "cancel" ? <Loader2 size={14} className="animate-spin" /> : null}
                Cancel checkout
              </Button>
            ) : null}
          </div>
        ) : null}

        {planEnded ? (
          <div className={styles.endedBanner}>
            {rawSubStatus === "cancelled"
              ? `${planName} is no longer your active plan. Choose a plan below to restore service — agents are not answering while cancelled.`
              : `${planName} is suspended. Settle payment or contact support — agents are not answering.`}
          </div>
        ) : null}

        {/* Section 1: Top 2 Cards (CURRENT PLAN & ONE-TIME SETUP) */}
        <div className={styles.topCardGrid}>
          
          {/* Card 1: CURRENT / LAST PLAN */}
          <div className={styles.card}>
            <div>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>
                  {planEnded ? "LAST PLAN" : pendingPayment ? "PENDING PLAN" : rawSubStatus === "trialing" ? "TRIAL PLAN" : "CURRENT PLAN"}
                </span>
                <div className={styles.cardIconBox}>
                  <CreditCard size={18} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px', flexWrap: 'wrap' }}>
                <h2 className={styles.cardTitle} style={{ margin: 0, color: planEnded ? '#64748B' : '#0A1A2F' }}>
                  {planName}
                </h2>
                {!planEnded && !pendingPayment && rawSubStatus === "active" && (
                  <span className={styles.activePlanBadge}>
                    <span className={styles.activeDot} /> Active Plan
                  </span>
                )}
                {!planEnded && !pendingPayment && rawSubStatus === "trialing" && (
                  <span className={styles.pendingPlanBadge}>
                    Free Trial
                  </span>
                )}
                {pendingPayment && (
                  <span className={styles.pendingPlanBadge}>
                    Pending Payment
                  </span>
                )}
              </div>
              {planEnded ? (
                <p style={{ fontSize: 13, color: '#991B1B', fontWeight: 600, margin: '0 0 16px' }}>
                  Not active — {rawSubStatus === "cancelled" ? "subscription ended" : "workspace suspended"}
                </p>
              ) : rawSubStatus === "trialing" ? (
                <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600, margin: '0 0 16px' }}>
                  {trialAutopayStatusLine(subscription)}
                </p>
              ) : (
                <div style={{ height: 4, marginBottom: 14 }} />
              )}

              <div className={styles.infoPillGrid}>
                <div className={styles.infoPill}>
                  <p className={styles.infoPillLabel}>
                    {rawSubStatus === "trialing" ? "Trial end date" : planEnded ? "Last billing period" : "Billing period"}
                  </p>
                  <p className={styles.infoPillValue}>
                    {subscription?.current_period_start && subscription?.current_period_end
                      ? `${dateOnly(subscription.current_period_start)} — ${dateOnly(subscription.current_period_end)}`
                      : (wallet?.period_end ? `Until ${dateOnly(wallet.period_end)}` : (planEnded ? "—" : "Monthly renewal"))}
                  </p>
                </div>
                <div className={styles.infoPill}>
                  <p className={styles.infoPillLabel}>Conversation pool</p>
                  <p className={styles.infoPillValue}>
                    {quotaBase.toLocaleString()} / month
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardFooterChips}>
              <div className={styles.chipItem}>
                <span className={styles.chipLabel}>Website</span>
                <span className={styles.chipValue}>
                  {websiteInUse != null ? `${websiteInUse} in use · ` : ""}
                  {websiteOwned} allowed
                  {websiteExtras > 0 ? ` (+${websiteExtras} add-on${websiteExtras === 1 ? "" : "s"})` : ""}
                </span>
              </div>
              <div className={styles.chipItem}>
                <span className={styles.chipLabel}>WhatsApp</span>
                <span className={styles.chipValue}>
                  {whatsappInUse != null ? `${whatsappInUse} in use · ` : ""}
                  {whatsappOwned} allowed
                  {whatsappExtras > 0 ? ` (+${whatsappExtras} add-on${whatsappExtras === 1 ? "" : "s"})` : ""}
                </span>
              </div>
              {(websiteAgentNames.length > 0 || whatsappAgentNames.length > 0) && (
                <div className={styles.chipItem} style={{ gridColumn: "1 / -1" }}>
                  <span className={styles.chipLabel}>Agents counted</span>
                  <span className={styles.chipValue} style={{ fontSize: 12, lineHeight: 1.45 }}>
                    {websiteAgentNames.length > 0
                      ? `Website: ${websiteAgentNames.map((a) => `${a.name}${a.mode === "unified" ? " (unified)" : ""}`).join(", ")}`
                      : null}
                    {websiteAgentNames.length > 0 && whatsappAgentNames.length > 0 ? " · " : null}
                    {whatsappAgentNames.length > 0
                      ? `WhatsApp: ${whatsappAgentNames.map((a) => `${a.name}${a.mode === "unified" ? " (unified)" : ""}`).join(", ")}`
                      : null}
                    {(websiteAgentNames.some((a) => a.mode === "unified") || whatsappAgentNames.some((a) => a.mode === "unified"))
                      ? " — Unified agents count toward both limits."
                      : null}
                  </span>
                </div>
              )}
              <div className={`${styles.chipItem} ${overageSettings?.overage_enabled ? styles.chipItemActive : ''}`}>
                <span className={styles.chipLabel}>Overage</span>
                <span className={overageSettings?.overage_enabled ? styles.chipValueTeal : styles.chipValue}>
                  {overageSettings?.overage_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {cancelUi.showSection && cancelUi.scheduledEnd ? (
                <div className={styles.chipItem} style={{ gridColumn: "1 / -1" }}>
                  <span className={styles.chipLabel}>Cancellation</span>
                  <span className={styles.chipValue} style={{ color: "#92400E" }}>
                    Ends {dateTime(cancelUi.scheduledEnd)}
                  </span>
                </div>
              ) : null}
            </div>
            {canManage && cancelUi.canCancel && !pendingPayment ? (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E2E8F0" }}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={Boolean(busyAction)}
                  onClick={openCancelModal}
                  style={{ fontSize: 12, color: "#DC2626", padding: "6px 0" }}
                >
                  {busyAction === "cancel" ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  {cancelActionLabel(cancelUi.kind)}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Card 2: ONE-TIME SETUP */}
          <div className={styles.card}>
            <div>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>ONE-TIME SETUP</span>
                <div className={styles.cardIconBox}>
                  <Zap size={18} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 10px' }}>
                <h2 className={styles.cardTitle} style={{ fontSize: 30, margin: 0, color: '#0A1A2F' }}>
                  {currentPlan?.setup_fee_inr ? inr(Number(currentPlan.setup_fee_inr)) : "₹0"}
                </h2>
              </div>

              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                Optional assisted setup fee. Covers dedicated onboarding and live dashboard setup.
              </p>
            </div>

            <div style={{ marginTop: 20 }}>
              {!setupFeePaid && currentPlan?.setup_fee_required ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                  <AlertTriangle size={16} />
                  <span>Setup fee of {inr(Number(currentPlan.setup_fee_inr))} is outstanding — going live is blocked until paid.</span>
                </div>
              ) : !currentPlan?.setup_fee_required && Number(currentPlan?.setup_fee_inr) > 0 ? (
                <div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                    Optional — only if you'd like us to set it up for you. Prefer to do it yourself? No charge, just get started.
                  </div>
                  <button
                    type="button"
                    onClick={requestAssistedSetup}
                    disabled={busyAction === 'setupFee'}
                    className={styles.refreshBtn}
                    style={{ background: '#0A1A2F', color: '#fff', border: 'none', padding: '10px 18px' }}
                  >
                    {busyAction === 'setupFee' ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>Request assisted setup</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: 13, fontWeight: 700, background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: 999 }}>
                  <ShieldCheck size={16} color="#166534" />
                  <span>Setup completed</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Payment Methods & Saved Cards Section */}
        <PaymentMethodsSection
          canManage={canManage}
          subscription={subscription}
          onPaymentMethodsChanged={() => {
            void load();
            reload();
          }}
        />

        {/* Section 2: Conversation Usage Progress Card */}
        <div className={styles.usageCard}>
          <div className={styles.usageHeader}>
            <div>
              <h3 className={styles.usageTitle}>
                Conversation usage
              </h3>
              <p className={styles.usageSubtitle}>
                Website and WhatsApp share one monthly pool. Unlimited messages inside a counted conversation.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)', fontSize: 20, fontWeight: 800, color: '#111318' }}>
                {usedThisPeriod.toLocaleString()}
              </span>
              <span style={{ fontSize: 14, color: '#8A8D98', fontWeight: 600 }}>
                {" "}/ {quotaBase.toLocaleString()}
              </span>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8D98', marginTop: 2 }}>
                {usedPct}% used
              </div>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${usedPct}%` }} />
          </div>

          {/* 3 Sub-stat boxes */}
          <div className={styles.subStatGrid}>
            <div className={styles.subStatBox}>
              <p className={styles.subStatLabel}>Plan quota remaining</p>
              <p className={styles.subStatValue}>
                {remainingInPool.toLocaleString()}
              </p>
            </div>

            <div className={styles.subStatBox}>
              <p className={styles.subStatLabel}>Overage conversations</p>
              <p className={styles.subStatValue}>
                {overageConvos.toLocaleString()}
              </p>
            </div>

            <div className={styles.subStatBox}>
              <p className={styles.subStatLabel}>Est. overage</p>
              <p className={styles.subStatValue}>
                {inr(estOverageAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* At Capacity Banner (Blocked) */}
        {entitlements?.at_capacity ? (
          <div style={{
            padding: '14px 18px',
            borderRadius: 14,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <AlertOctagon size={18} color="#991B1B" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#991B1B' }}>Conversation pool exhausted</p>
              <p style={{ margin: 0, fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                You have reached 100% of your monthly conversation pool. Because overage billing is turned off, the AI is blocked from answering new conversations.
              </p>
            </div>
          </div>
        ) : null}

        {/* Exhausted & Overage Active Banner (warn_100) */}
        {entitlements?.warn_100 && !entitlements?.at_capacity ? (
          <div style={{
            padding: '14px 18px',
            borderRadius: 14,
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <Sparkles size={18} color="#0369A1" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0369A1' }}>Overage billing active</p>
              <p style={{ margin: 0, fontSize: 13, color: '#075985', lineHeight: 1.5 }}>
                You have reached 100% of your monthly conversation pool. Overage billing is enabled — conversations above your limit are being charged.
              </p>
            </div>
          </div>
        ) : null}

        {/* Usage Warning Banner (warn_80) */}
        {entitlements?.warn_80 && !entitlements?.warn_100 && !entitlements?.at_capacity ? (
          <div style={{
            padding: '14px 18px',
            borderRadius: 14,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <AlertTriangle size={18} color="#B45309" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#92400E' }}>Usage threshold reached</p>
              <p style={{ margin: 0, fontSize: 13, color: '#A16207', lineHeight: 1.5 }}>
                You have used more than {billingConfig?.usage_warning_threshold_pct ?? 80}% of your monthly conversation pool.
              </p>
            </div>
          </div>
        ) : null}

        {/* Overage & Seats Cards */}
        <div className={styles.topCardGrid}>

          {/* Overage Toggle Card */}
          {canManage ? (
            <div className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.cardLabel}>OVERAGE BILLING</span>
                  <div className={styles.cardIconBox}>
                    <Zap size={18} />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#6B6970', lineHeight: 1.55, margin: '0 0 16px' }}>
                  When enabled, conversations above your monthly pool are billed at the plan&apos;s extra-conversation rate
                  (the only per-unit rate). When disabled, the current chat can finish; new chats are refused and a human is offered.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: '#F7F5FA', border: '1px solid #E8E3F4', marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111318' }}>
                      {overageSettings?.overage_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#8A8D98' }}>
                      {overageSettings?.overage_enabled
                        ? 'Extra conversations billed until the monthly spend cap'
                        : 'AI stops for new chats when allocation is exhausted — no extra charges'}
                    </p>
                  </div>
                  <button
                    id="overage-toggle-btn"
                    type="button"
                    disabled={overageToggleBusy}
                    onClick={async () => {
                      setOverageToggleBusy(true);
                      try {
                        const next = !overageSettings?.overage_enabled;
                        const updated = await apiRequest<OverageSettings>('/v1/billing/overage', {
                          method: 'PATCH',
                          body: {
                            overage_enabled: next,
                            overage_cap_inr: next
                              ? (overageSettings?.overage_cap_inr != null
                                ? Number(overageSettings.overage_cap_inr)
                                : null)
                              : null,
                          },
                        });
                        setOverageSettings(updated);
                        await reload();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not update overage setting');
                      } finally {
                        setOverageToggleBusy(false);
                      }
                    }}
                    style={{
                      position: 'relative',
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      border: 'none',
                      cursor: overageToggleBusy ? 'wait' : 'pointer',
                      background: overageSettings?.overage_enabled ? 'linear-gradient(135deg, #0396A6, #065E6A)' : '#D1D5DB',
                      transition: 'background 0.2s',
                      padding: 0,
                      flexShrink: 0,
                    }}
                    aria-label={overageSettings?.overage_enabled ? 'Disable overage billing' : 'Enable overage billing'}
                    aria-checked={overageSettings?.overage_enabled ?? false}
                    role="switch"
                  >
                    <span style={{
                      position: 'absolute',
                      top: 3,
                      left: overageSettings?.overage_enabled ? 27 : 3,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {overageSettings?.overage_enabled ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A8D98', textTransform: 'uppercase' }}>
                        Monthly spend cap (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        defaultValue={overageSettings.overage_cap_inr ?? ''}
                        placeholder="No cap"
                        id="overage-cap-input"
                        className={styles.couponInput}
                        style={{ marginTop: 4, width: '100%' }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={overageToggleBusy}
                      onClick={async () => {
                        const el = document.getElementById('overage-cap-input') as HTMLInputElement | null;
                        const raw = el?.value?.trim() ?? '';
                        const cap = raw === '' ? null : Number(raw);
                        if (raw !== '' && (!Number.isFinite(cap) || (cap as number) < 0)) {
                          setError('Enter a valid overage cap in ₹');
                          return;
                        }
                        setOverageToggleBusy(true);
                        try {
                          const updated = await apiRequest<OverageSettings>('/v1/billing/overage', {
                            method: 'PATCH',
                            body: { overage_enabled: true, overage_cap_inr: cap },
                          });
                          setOverageSettings(updated);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Could not save cap');
                        } finally {
                          setOverageToggleBusy(false);
                        }
                      }}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none',
                        background: '#0A1A2F', color: '#fff', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', height: 40, minHeight: 40,
                      }}
                    >
                      Save cap
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Seats Card */}
          {seatsInfo ? (
            <div className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.cardLabel}>TEAM SEATS</span>
                  <div className={styles.cardIconBox}>
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div className={styles.infoPillGrid}>
                  <div className={styles.infoPill}>
                    <p className={styles.infoPillLabel}>Included</p>
                    <p className={styles.subStatValue}>{seatsInfo.included_seats}</p>
                  </div>
                  <div className={styles.infoPill}>
                    <p className={styles.infoPillLabel}>In use</p>
                    <p className={styles.subStatValue}>{seatsInfo.seats_used}</p>
                  </div>
                </div>
                {seatsInfo.additional_seats > 0 ? (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 13, marginBottom: 16 }}>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#92400E' }}>{seatsInfo.additional_seats} additional {seatsInfo.additional_seats === 1 ? 'seat' : 'seats'}</p>
                    <p style={{ margin: 0, color: '#B45309' }}>₹{seatsInfo.estimated_seat_charge_inr} / month (₹{seatsInfo.additional_seat_price_inr}/seat)</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#6B6970', margin: '0 0 16px 0' }}>All seats within your plan's included allowance.</p>
                )}
              </div>
              <div>
                <button
                  type="button"
                  disabled={busyAction === 'purchaseSeat'}
                  onClick={() => void purchaseExtraSeat()}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid #B8E0E2',
                    background: '#EAF8F8',
                    color: '#0396A6',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: busyAction === 'purchaseSeat' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    minHeight: 42,
                  }}
                >
                  {busyAction === 'purchaseSeat' ? <Loader2 size={16} className="animate-spin text-[#0396A6]" /> : null}
                  <span>Purchase extra seat (+₹{seatsInfo.additional_seat_price_inr || 999}/mo)</span>
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* Section 3: Choose a Plan Cards — always for managers so cancelled/suspended can reactivate;
            active merchants use plan-change from the same cards. */}
        {canManage ? (
          <div>
            <div className={styles.planSectionHeader}>
              <div className={styles.planSectionHeaderLeft}>
                <h2 style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)', fontSize: 20, fontWeight: 700, color: '#111318', margin: '0 0 4px' }}>
                  {pendingPayment
                    ? "Finish activating your plan"
                    : planEnded
                      ? "Restore your plan"
                      : openCheckout && planLive
                        ? "Change plan"
                        : "Choose a plan"}
                </h2>
                <p style={{ fontSize: 13, color: '#8A8D98', margin: 0 }}>
                  {pendingPayment
                    ? "Complete payment on the pending checkout, or cancel it before switching plans."
                    : planEnded
                      ? "Your previous plan is no longer active. Choose a plan below to restore service."
                      : openCheckout && planLive
                        ? "Switching plans updates your subscription in place when paid."
                        : "All plans include 1 Website + 1 WhatsApp channel, all features included."}
                </p>
              </div>

              {/* Coupon code on the right side of Choose a plan */}
              <div className={styles.couponWrap}>
                <div className={styles.couponRow}>
                  <input
                    type="text"
                    placeholder="Have a coupon code?"
                    value={couponCode}
                    className={styles.couponInput}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); if (couponNotice) { setCouponNotice(null); setAppliedCoupon(null); } }}
                  />
                  <Button
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    style={{
                      height: 40,
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #0396A6 0%, #065E6A 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      padding: '0 18px',
                    }}
                  >
                    {applyingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {couponNotice && (
                  <div style={{ fontSize: 12, fontWeight: 500, color: couponNotice.type === 'success' ? '#16A34A' : '#DC2626', marginTop: 4 }}>
                    {couponNotice.type === 'success' ? <Check size={13} style={{display:'inline', marginRight:4}}/> : <AlertTriangle size={13} style={{display:'inline', marginRight:4}}/>}
                    {couponNotice.message}
                  </div>
                )}
              </div>
            </div>

            {/* Centered Billing Cycle Toggles */}
            <div className={styles.cycleContainerCenter}>
              <div className={styles.cyclePills}>
                {DASHBOARD_BILLING_CYCLES.map(({ key, label, save }) => {
                  const isActive = billingCycle === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBillingCycle(key)}
                      className={`${styles.cycleBtn} ${isActive ? styles.cycleBtnActive : ''}`}
                    >
                      {label}
                      {save ? (
                        <span className={`${styles.saveBadge} ${isActive ? styles.saveBadgeActive : ''}`}>
                          {save}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan cards grid */}
            {displayPlans.length === 0 ? (
              <p style={{ fontSize: 14, color: '#8A8D98' }}>No Core plans loaded from the server. Use Retry at the top — checkout is disabled until catalog prices arrive.</p>
            ) : null}

            <div className={styles.mobileScrollHint}>
              <span>Swipe horizontally to compare plans</span>
              <ArrowRight size={13} />
            </div>

            <div className={styles.planGrid}>
              {displayPlans.map((plan) => {
                const isCurrent = planLive && subscription?.plan_slug === plan.slug;
                const isGrowth = plan.slug === 'growth';
                const monthlyRate = Number(plan.price_monthly ?? plan.price_monthly_inr ?? 0);
                const planConvos = plan.included_conversations || 0;
                const overagePrice = Number(plan.overage_rate ?? plan.overage_rate_inr ?? 0);
                const seatsCount = plan.included_seats || (plan.slug === 'starter' ? 2 : plan.slug === 'growth' ? 3 : plan.slug === 'scale' ? 4 : 10);
                const canResume = pendingPayment && subscription?.plan_slug === plan.slug;
                const opensAbandon = pendingPayment && subscription?.plan_slug !== plan.slug;
                const buttonDisabled = Boolean(busyAction) || (isCurrent && !pendingPayment);

                const periodTotal = catalogTermTotal(plan, billingCycle);
                const months = TERM_MONTHS[billingCycle];
                const perMonth = periodTotal > 0 ? periodTotal / months : monthlyRate;
                const listMonthly = catalogTermTotal(plan, "monthly") || monthlyRate;
                const savings = billingCycle === "monthly" || periodTotal <= 0
                  ? 0
                  : Math.max(0, listMonthly * months - periodTotal);
                const displayPerMonth = appliedCoupon && plan.slug !== 'enterprise'
                  ? Math.max(0, appliedCoupon.discount_type === 'percentage' ? perMonth * (1 - appliedCoupon.discount_value / 100) : perMonth - appliedCoupon.discount_value)
                  : perMonth;
                const displayPeriodTotal = appliedCoupon && plan.slug !== 'enterprise'
                  ? Math.max(0, appliedCoupon.discount_type === 'percentage' ? periodTotal * (1 - appliedCoupon.discount_value / 100) : periodTotal - appliedCoupon.discount_value)
                  : periodTotal;

                let buttonLabel = planEnded ? `Reactivate ${plan.name}` : `Start 7-Day Free Trial`;
                if (pendingPayment && subscription?.plan_slug === plan.slug) buttonLabel = "Complete payment";
                else if (isCurrent) buttonLabel = "Current plan";
                else if (opensAbandon) buttonLabel = "Cancel pending to switch";
                else if (openCheckout && !planEnded && !pendingPayment) buttonLabel = `Switch to ${plan.name}`;
                if (busyAction === `subscribe-${plan.slug}` || (canResume && busyAction === 'resume')) buttonLabel = "Working...";
                else if (selectedPlanSlug === plan.slug && needsSetupChoice(plan) && !setupPath && !canResume && !opensAbandon && !isCurrent) buttonLabel = "Select setup path";

                return (
                  <div
                    key={plan.id || plan.slug}
                    className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ''} ${isGrowth && !isCurrent ? styles.planCardGrowth : ''}`}
                    style={{ opacity: opensAbandon ? 0.75 : 1 }}
                  >
                    <div>
                      {/* Top slot for badge or savings pill */}
                      <div className={styles.planCardTop}>
                        {savings > 0 && plan.slug !== 'enterprise' ? (
                          <span className={styles.savingsPill}>
                            <Check size={10} /> Save {money(savings, priceCurrency)}
                          </span>
                        ) : (
                          <span />
                        )}

                        {isCurrent ? (
                          <span className={styles.planTagCurrent}>
                            <span className={styles.activeDot} /> CURRENT PLAN
                          </span>
                        ) : isGrowth ? (
                          <span className={styles.planTagPopular}>
                            MOST POPULAR
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>

                      <h3 className={styles.planName}>
                        {plan.name}
                      </h3>

                      {plan.slug === 'enterprise' ? (
                        <div className={styles.planPriceRow}>
                          <span className={styles.planPriceValue}>Custom</span>
                        </div>
                      ) : (
                        <>
                          {appliedCoupon && displayPerMonth < perMonth && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A4B0', textDecoration: 'line-through', display: 'block', marginBottom: 2 }}>{money(perMonth, priceCurrency)}</span>
                          )}
                          <div className={styles.planPriceBlock}>
                            <div className={styles.planPriceRow}>
                              <span className={styles.planPriceValue}>{money(Math.round(displayPerMonth), priceCurrency)}</span>
                              <span className={styles.planPriceUnit}>/mo</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Billing period label */}
                      <p className={styles.planPeriodLabel}>
                        {plan.slug === 'enterprise' ? 'Custom invoicing' :
                          billingCycle === 'monthly' ? 'Billed monthly' :
                          billingCycle === 'quarterly' ? `Billed quarterly (${money(Math.round(displayPeriodTotal), priceCurrency)})` :
                          billingCycle === 'semi_annual' ? `Billed 6 months (${money(Math.round(displayPeriodTotal), priceCurrency)})` :
                          `Billed annually (${money(Math.round(displayPeriodTotal), priceCurrency)})`}
                      </p>

                      {/* Volume box */}
                      <div className={styles.volumeBox}>
                        <p className={styles.volumeBoxTitle}>VOLUME</p>
                        <p className={styles.volumeBoxConvos}>
                          {planConvos ? `${planConvos.toLocaleString()} conversations` : 'Custom volume'}
                        </p>
                        <p className={styles.volumeBoxOverage}>
                          {overagePrice > 0 ? `Overage: ${money(overagePrice, priceCurrency)} / extra conversation` : 'Custom volume overage'}
                        </p>
                      </div>

                      {/* Seats box */}
                      <div className={styles.seatsBox}>
                        <p className={styles.seatsBoxLabel}>Team Seats</p>
                        <p className={styles.seatsBoxValue}>
                          {plan.slug === 'enterprise' ? 'Custom team seats' : `${seatsCount} team seats`}
                        </p>
                      </div>

                      {/* Features */}
                      <ul className={styles.featureList}>
                        <li className={styles.featureItem}>
                          <Check size={13} color="#0396A6" /> All platform capabilities included
                        </li>
                        {plan.slug !== 'enterprise' && (
                          <li className={styles.featureItem}>
                            <ArrowUpRight size={13} color="#0396A6" /> 7-day trial (up to 50 conversations)
                          </li>
                        )}
                      </ul>

                      {/* Setup choice expansion */}
                      {selectedPlanSlug === plan.slug ? (
                        <div style={{ marginTop: 12 }}>
                          <SetupChoice
                            planSlug={plan.slug}
                            setupFeeInr={Number(plan.setup_fee_inr || 0)}
                            setupFeeRequired={Boolean(plan.setup_fee_required)}
                            value={setupPath}
                            onChange={setSetupPath}
                            disabled={Boolean(busyAction)}
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: 16 }}>
                      {plan.slug === 'enterprise' ? (
                        <a href="mailto:sales@frostrek.com?subject=Frosty%20Agent%20Enterprise%20Plan%20Inquiry"
                          className={styles.planCtaBtn}
                          style={{ background: '#0A1A2F', color: '#FFFFFF', textDecoration: 'none', boxShadow: '0 4px 14px rgba(10,26,47,0.15)' }}>
                          <Mail size={14} /> Talk to us
                        </a>
                      ) : isCurrent && !pendingPayment ? (
                        <div className={styles.currentPlanBtn}>
                          <Check size={15} strokeWidth={2.5} /> Current Plan
                        </div>
                      ) : (
                        <button type="button" disabled={buttonDisabled}
                          onClick={() => {
                            if (canResume) void resumeCheckout();
                            else if (opensAbandon) setShowCancelModal(true);
                            else if (selectedPlanSlug !== plan.slug && needsSetupChoice(plan)) {
                              setSelectedPlanSlug(plan.slug); setSetupPath(null); setError(null);
                            } else {
                              if (selectedPlanSlug !== plan.slug) setSelectedPlanSlug(plan.slug);
                              void subscribe(plan.slug);
                            }
                          }}
                          className={styles.planCtaBtn}
                          style={{
                            background: isGrowth || canResume ? 'linear-gradient(135deg,#0396A6,#065E6A)' : '#0A1A2F',
                            color: '#FFFFFF',
                            cursor: buttonDisabled ? 'default' : 'pointer',
                            boxShadow: isGrowth || canResume ? '0 4px 14px rgba(3,150,166,0.3)' : '0 4px 14px rgba(10,26,47,0.15)',
                            opacity: buttonDisabled ? 0.7 : 1,
                          }}
                        >
                          {buttonLabel}
                          {!buttonDisabled && <ArrowUpRight size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Section 4: Channel add-ons */}
        <div className={styles.card}>
          <div style={{ marginBottom: 16 }}>
            <h3 className={styles.usageTitle}>
              Channel add-ons
            </h3>
            <p className={styles.usageSubtitle}>
              {(() => {
                const isExport = entitlements?.tax_treatment === 'export';
                const addOnPrice = isExport
                  ? (billingConfig?.extra_channel_price_usd ? `$${billingConfig.extra_channel_price_usd}` : '$85')
                  : (billingConfig?.extra_channel_price_inr ? `₹${Number(billingConfig.extra_channel_price_inr).toLocaleString('en-IN')}` : '₹2,999');
                const addOnBonus = billingConfig?.extra_channel_bonus_conversations ?? 50;
                return `${addOnPrice} each · adds +${addOnBonus} conversations to your monthly limit`;
              })()}
            </p>
          </div>

          <div className={styles.addonGrid}>
            
            {/* Add-on 1: Additional Website */}
            <div className={styles.addonCard}>
              <div className={styles.addonInfo}>
                <div className={styles.addonIconBox}>
                  <Globe size={18} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1A2F', margin: '0 0 2px' }}>Additional Website</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Owned: {websiteOwned}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void handleAddChannel('website')}
                className={styles.addonBtn}
              >
                {busyAction === 'addon-website' ? 'Working...' : `Add ${entitlements?.tax_treatment === 'export' ? (billingConfig?.extra_channel_price_usd ? '$'+billingConfig.extra_channel_price_usd : '$85') : (billingConfig?.extra_channel_price_inr ? '₹'+Number(billingConfig.extra_channel_price_inr).toLocaleString('en-IN') : '₹2,999')}`}
              </button>
            </div>

            {/* Add-on 2: Additional WhatsApp */}
            <div className={styles.addonCard}>
              <div className={styles.addonInfo}>
                <div className={styles.addonIconBox}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1A2F', margin: '0 0 2px' }}>Additional WhatsApp</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Owned: {whatsappOwned}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void handleAddChannel('whatsapp')}
                className={styles.addonBtn}
              >
                {busyAction === 'addon-whatsapp' ? 'Working...' : `Add ${entitlements?.tax_treatment === 'export' ? (billingConfig?.extra_channel_price_usd ? '$'+billingConfig.extra_channel_price_usd : '$85') : (billingConfig?.extra_channel_price_inr ? '₹'+Number(billingConfig.extra_channel_price_inr).toLocaleString('en-IN') : '₹2,999')}`}
              </button>
            </div>

          </div>
        </div>

        {/* Section 5: Top up Credits Form */}
        {canManage && (
          <div className={styles.card}>
            <h3 className={styles.usageTitle} style={{ margin: '0 0 16px' }}>
              Top up credits
            </h3>
            <form onSubmit={(e) => void topup(e)} className={styles.topupForm}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <Field
                  label={entitlements?.tax_treatment === 'export' ? "Amount ($)" : "Amount (₹, before GST)"}
                  name="topup"
                  type="number"
                  value={topupAmount}
                  onChange={setTopupAmount}
                  hint={entitlements?.tax_treatment === 'export' ? "Credits are applied instantly when payment clears. 0% GST." : "GST at 18% is added on top. Credits are applied instantly when payment clears."}
                />
              </div>
              <Button type="submit" loading={busyAction === 'topup'} disabled={Boolean(busyAction) && busyAction !== 'topup'} style={{ background: 'linear-gradient(135deg, #0396A6, #065E6A)', border: 'none', color: '#FFFFFF', padding: '10px 22px', borderRadius: 12, fontWeight: 700, minHeight: 42 }}>
                Top up
              </Button>
            </form>
          </div>
        )}

        {/* Section 6: Invoice & Charge History Table */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 className={styles.usageTitle}>
                Invoice & charge history
              </h3>
              <p className={styles.usageSubtitle}>
                GST invoices issued for subscriptions, overage, and add-ons
              </p>
            </div>
            <Link href="/billing/invoices">
              <Button variant="ghost" size="sm" style={{ color: '#0396A6', fontWeight: 600 }}>
                Invoices & GSTIN <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
              </Button>
            </Link>
          </div>

          {!invoices.length ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              No tax invoices yet. They appear when a subscription period is charged or overage is billed.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className={styles.invoiceTableDesktop}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>
                      <th style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' }}>Invoice</th>
                      <th style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' }}>Type</th>
                      <th style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' }}>Period</th>
                      <th style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' }}>Total</th>
                      <th style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', color: '#0A1A2F' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                          {inv.invoice_type.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                          {inv.billing_period_start ? `${dateOnly(inv.billing_period_start)} – ${dateOnly(inv.billing_period_end)}` : dateOnly(inv.issued_at)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                          {inr(Number(inv.total_inr))}
                          {Number(inv.gst_amount_inr) > 0 ? (
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#64748B' }}>
                              incl. GST {inv.gst_rate}%
                            </span>
                          ) : null}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span className={styles.statusBadge} style={{
                            background: inv.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                            color: inv.status === 'paid' ? '#166534' : '#92400E',
                            fontSize: 11,
                          }}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className={styles.invoiceCardsMobile}>
                {invoices.map((inv) => (
                  <div key={inv.id} className={styles.invoiceCardMobile}>
                    <div className={styles.invoiceCardMobileHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0A1A2F' }}>{inv.invoice_number}</span>
                      <span className={styles.statusBadge} style={{
                        background: inv.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                        color: inv.status === 'paid' ? '#166534' : '#92400E',
                        fontSize: 10,
                        padding: '2px 8px',
                      }}>
                        {inv.status}
                      </span>
                    </div>
                    <div className={styles.invoiceCardMobileRow}>
                      <span>Type:</span>
                      <span style={{ fontWeight: 600, color: '#0A1A2F' }}>{inv.invoice_type.replace(/_/g, " ")}</span>
                    </div>
                    <div className={styles.invoiceCardMobileRow}>
                      <span>Period:</span>
                      <span>{inv.billing_period_start ? `${dateOnly(inv.billing_period_start)} – ${dateOnly(inv.billing_period_end)}` : dateOnly(inv.issued_at)}</span>
                    </div>
                    <div className={styles.invoiceCardMobileRow} style={{ paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 600 }}>Total:</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0A1A2F' }}>{inr(Number(inv.total_inr))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Table Footer Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {invoiceCursor ? (
                <Button type="button" variant="ghost" size="sm" disabled={Boolean(busyAction)} onClick={() => void loadMoreInvoices()}>
                  {busyAction === 'invoices' ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Load more invoices
                </Button>
              ) : (
                <Link href="/billing/invoices">
                  <Button variant="ghost" size="sm" style={{ color: '#0396A6', fontWeight: 600, fontSize: 12 }}>
                    View all invoices <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Section 7: How billing works Notice Card */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)', fontSize: 16, fontWeight: 700, color: '#0A1A2F', margin: '0 0 8px' }}>
            How billing works
          </h4>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
            1 conversation = 1 full chat session (unlimited messages). Website and WhatsApp count toward the same monthly limit. After the limit, soft overage continues at your plan rate. New conversations are blocked only if the subscription is past due or suspended.
          </p>
        </div>

        {/* Section 8: Cancel subscription */}
        {cancelUi.showSection && (
          <div style={{
            background: cancelUi.scheduledEnd ? '#FFFBEB' : '#FFFFFF',
            border: cancelUi.scheduledEnd ? '1px solid #FDE68A' : '1px solid #E8E3F4',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: cancelUi.scheduledEnd ? '#FEF3C7' : '#F7F5FA',
                border: cancelUi.scheduledEnd ? '1px solid #FDE68A' : '1px solid #E8E3F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: cancelUi.scheduledEnd ? '#B45309' : '#673EBE',
                flexShrink: 0,
              }}>
                {cancelUi.scheduledEnd ? <AlertTriangle size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#111318', margin: '0 0 4px' }}>
                  {cancelUi.scheduledEnd
                    ? "Subscription ending"
                    : cancelUi.canCancel
                      ? "Cancel subscription"
                      : "Subscription support"}
                </h4>
                <p style={{ fontSize: 13, color: '#6B6970', lineHeight: 1.55, margin: 0 }}>
                  {cancelDescription}
                </p>
                {cancelUi.canCancel && cancelUi.mfaRequired ? (
                  <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5, margin: '8px 0 0' }}>
                    Requires authenticator sign-in — you may be asked to sign out and back in with 2FA.
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              {(cancelUi.blockedReason || cancelUi.scheduledEnd) && (
                <a
                  href="mailto:support@frostrek.com?subject=Subscription%20Support%20Request"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 12,
                    border: '1px solid #DDD6EE',
                    background: '#F7F5FA',
                    color: '#5F23C8',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={14} />
                  <span>Contact support</span>
                </a>
              )}

              {cancelUi.canCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={Boolean(busyAction)}
                  onClick={openCancelModal}
                  style={{ fontSize: 13, color: '#DC2626', fontWeight: 700 }}
                >
                  {busyAction === 'cancel' ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  {cancelActionLabel(cancelUi.kind)}
                </Button>
              ) : null}
            </div>
          </div>
        )}

      </div>

      {/* Global Confirm Modal for Cancellation */}
      <ConfirmModal
        show={showCancelModal}
        tone="danger"
        title={
          pendingPayment
            ? "Cancel pending checkout?"
            : guaranteeData
              ? "Cancel with 14-day Guarantee?"
              : cancelUi.kind === "trial"
                ? "Cancel free trial?"
                : "Cancel subscription?"
        }
        message={
          pendingPayment
            ? "This abandons the unpaid checkout so you can choose a different plan. No charge has been taken yet."
            : guaranteeData
              ? `You are eligible for the 14-day money-back guarantee.\n\nConversations used: ${guaranteeData.conversations_used}\nFree allowance (20%): ${guaranteeData.free_allowance}\n\nAmount charged: ₹${guaranteeData.amount_charged_inr}\nAmount refunded: ₹${guaranteeData.amount_refunded_inr}\n\nSubmitting this will send a cancellation request to our team for approval. Your agents will continue answering until it is approved. Type CANCEL to confirm.`
              : cancelUi.kind === "trial"
                ? "Your trial ends immediately and agents stop answering. If autopay was set up, cancel before the first plan charge. Type CANCEL to confirm."
                : "Your agents keep answering to the end of the current period, then stop. Your data is retained for 30 days. Type CANCEL to confirm."
        }
        confirmText={
          pendingPayment
            ? "Cancel checkout"
            : guaranteeData
              ? "Submit Request"
              : cancelActionLabel(cancelUi.kind)
        }
        cancelText={pendingPayment ? "Keep checkout" : "Keep Subscription"}
        confirmPhrase={pendingPayment ? undefined : "CANCEL"}
        onConfirm={handleCancelSubscription}
        onCancel={() => setShowCancelModal(false)}
      />
    </AppShell>
  );
}

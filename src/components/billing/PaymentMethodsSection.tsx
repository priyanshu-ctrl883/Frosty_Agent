"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest, ApiClientError } from "@/lib/api";
import { dateOnly } from "@/lib/format";
import type { PaymentMethod, AddPaymentMethodOut, Subscription } from "@/lib/types";
import { autopayBadgeState } from "@/lib/onboardingBilling";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const loadCheckoutScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.remove();
    }
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () =>
      reject(
        new Error(
          "Could not load Razorpay Checkout SDK. If you are using an ad-blocker or Brave Shields, please disable it for this site and click Retry."
        )
      );
    document.body.appendChild(el);
  });

interface Props {
  canManage: boolean;
  subscription?: Subscription | null;
  onPaymentMethodsChanged?: () => void;
}

export function PaymentMethodsSection({ canManage, subscription, onPaymentMethodsChanged }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Delete modal state
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Add Card modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStage, setAddStage] = useState<"idle" | "authorizing" | "confirming" | "success" | "error">("idle");
  const [addError, setAddError] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<PaymentMethod[] | { data?: PaymentMethod[] }>("/v1/billing/payment-methods");
      const list = Array.isArray(res) ? res : (res?.data || []);
      setMethods(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const handleSetDefault = async (method: PaymentMethod) => {
    if (method.is_default || actionBusyId) return;
    setActionBusyId(method.id);
    setError(null);

    // Optimistic update
    const previous = [...methods];
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        is_default: m.id === method.id,
        is_primary: m.id === method.id,
      }))
    );

    try {
      await apiRequest(`/v1/billing/payment-methods/${encodeURIComponent(method.id)}/default`, {
        method: "PATCH",
      });
      await loadMethods();
      if (onPaymentMethodsChanged) onPaymentMethodsChanged();
    } catch (err) {
      // Rollback on failure
      setMethods(previous);
      setError(err instanceof Error ? err.message : "Could not update default payment method");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMethod) return;
    const methodId = deletingMethod.id;
    setActionBusyId(methodId);
    setError(null);

    try {
      await apiRequest(`/v1/billing/payment-methods/${encodeURIComponent(methodId)}`, {
        method: "DELETE",
      });
      setShowDeleteModal(false);
      setDeletingMethod(null);
      await loadMethods();
      if (onPaymentMethodsChanged) onPaymentMethodsChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError && err.code === "payment_method_required"
          ? "Cannot remove your only payment method while a subscription is active or trialing. Add a replacement card first."
          : err instanceof Error
            ? err.message
            : "Could not remove payment method"
      );
      setShowDeleteModal(false);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleStartAddCard = async () => {
    setAddError(null);
    setAddStage("authorizing");

    try {
      await loadCheckoutScript();
      const Checkout = window.Razorpay;
      if (!Checkout) {
        throw new Error("Payment gateway failed to load. Please try again.");
      }

      // Step 1: Request Setup Intent from backend
      const setupRes = await apiRequest<{ data?: AddPaymentMethodOut } | AddPaymentMethodOut>(
        "/v1/billing/payment-methods",
        {
          method: "POST",
          body: {},
        }
      );

      const setupData = (setupRes as { data?: AddPaymentMethodOut })?.data || (setupRes as AddPaymentMethodOut);
      const keyId = setupData.razorpay_key_id || setupData.setup_intent?.key_id;
      const orderId = setupData.razorpay_order_id || setupData.setup_intent?.order_id;

      if (!keyId) {
        throw new Error(
          "Razorpay Key ID is not configured in .env. Please set RAZORPAY_KEY_ID in .env with your Razorpay API key (rzp_test_... or rzp_live_...) to open the live gateway popup, or click Authorize with Test Card."
        );
      }

      // Step 2: Open Razorpay Mandate / Verification modal
      const rzp = new Checkout({
        key: keyId,
        order_id: orderId || undefined,
        amount: setupData.setup_intent?.amount || 100,
        currency: setupData.setup_intent?.currency || "INR",
        name: "Frosty Agent",
        description: "Add New Payment Method",
        modal: {
          ondismiss: () => {
            setAddStage("error");
            setAddError("Card verification was cancelled. Please try again.");
          },
        },
        theme: { color: "#4f46e5" },
        handler: async (response: {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
          razorpay_token_id?: string;
        }) => {
          if (!response.razorpay_payment_id && !response.razorpay_token_id) {
            setAddStage("error");
            setAddError("Authorization was not completed. Please try again.");
            return;
          }

          try {
            setAddStage("confirming");
            await apiRequest("/v1/billing/payment-methods", {
              method: "POST",
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_token_id: response.razorpay_token_id,
              },
            });

            setAddStage("success");
            await loadMethods();
            if (onPaymentMethodsChanged) onPaymentMethodsChanged();
            setTimeout(() => {
              setShowAddModal(false);
              setAddStage("idle");
            }, 1000);
          } catch (attachErr) {
            setAddStage("error");
            setAddError(
              attachErr instanceof Error
                ? attachErr.message
                : "Failed to save payment method. Please retry."
            );
          }
        },
      });

      // Close any open Radix modal BEFORE opening Razorpay so Radix does not trap pointer events!
      setShowAddModal(false);
      rzp.open();
    } catch (err) {
      setShowAddModal(true);
      setAddStage("error");
      setAddError(err instanceof Error ? err.message : "Could not open card setup dialog.");
    }
  };

  const handleAuthorizeDevCard = async () => {
    setAddError(null);
    setAddStage("confirming");
    try {
      await apiRequest("/v1/billing/payment-methods", {
        method: "POST",
        body: {
          razorpay_token_id: `tok_dev_${Math.random().toString(36).substring(2, 10)}`,
          display_last4: "4242",
          display_network: "Visa",
          display_bank: "HDFC Bank",
          display_label: "Visa •••• 4242 (Dev Test)",
        },
      });

      setAddStage("success");
      await loadMethods();
      if (onPaymentMethodsChanged) onPaymentMethodsChanged();
      setTimeout(() => {
        setShowAddModal(false);
        setAddStage("idle");
      }, 1000);
    } catch (err) {
      setAddStage("error");
      setAddError(err instanceof Error ? err.message : "Failed to save test card.");
    }
  };

  const getNetworkBadge = (network?: string | null) => {
    const net = (network || "CARD").toUpperCase();
    if (net.includes("VISA")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (net.includes("MASTER")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (net.includes("RUPAY")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (net.includes("AMEX")) return "bg-sky-50 text-sky-700 border-sky-200";
    return "bg-surface-container text-on-surface-variant border-border";
  };

  const autopayBadge = autopayBadgeState(subscription, methods.length);

  return (
    <div className="bg-surface-container-lowest border border-border/90 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-on-surface font-display">Payment Methods & Autopay</h3>
            {autopayBadge === "active" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autopay Active</span>
              </span>
            ) : autopayBadge === "pending" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Autopay Setup Required</span>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {autopayBadge === "not_required"
              ? "Your signup trial does not require a card yet. Add one when you choose a paid plan."
              : "Cards on file for recurring subscriptions, conversation overage, and add-on charges."}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            disabled={addStage === "authorizing" || addStage === "confirming"}
            onClick={() => void handleStartAddCard()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 transition-all cursor-pointer shrink-0 disabled:opacity-60"
          >
            {addStage === "authorizing" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Gateway…</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Payment Method</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/60 bg-surface-container-low/40 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container" />
                <div className="space-y-1.5">
                  <div className="w-32 h-3.5 rounded-md bg-surface-container" />
                  <div className="w-20 h-2.5 rounded-md bg-surface-container-high" />
                </div>
              </div>
              <div className="w-20 h-6 rounded-md bg-surface-container" />
            </div>
          ))}
        </div>
      ) : methods.length === 0 ? (
        /* Empty State */
        <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-surface-container-low/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">No Payment Methods on File</h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-0.5">
              Add a credit or debit card to keep your subscription and autonomous AI assistants running.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              disabled={addStage === "authorizing" || addStage === "confirming"}
              onClick={() => void handleStartAddCard()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-60"
            >
              {addStage === "authorizing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Gateway…</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Card</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* List of Payment Methods */
        <div className="space-y-3">
          {methods.map((method) => {
            const isDefault = method.is_default || method.is_primary;
            const isBusy = actionBusyId === method.id;

            return (
              <div
                key={method.id}
                className={`p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDefault
                    ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-xs"
                    : "bg-surface-container-low/60 border-border/80 hover:border-border"
                }`}
              >
                {/* Left Card Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 shadow-2xs">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-on-surface tracking-tight font-mono">
                        •••• •••• •••• {method.display_last4 || "••••"}
                      </span>

                      {method.display_network && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getNetworkBadge(
                            method.display_network
                          )}`}
                        >
                          {method.display_network}
                        </span>
                      )}

                      {isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 uppercase tracking-wider">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Default</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-on-surface-variant truncate">
                      {method.display_bank && <span>{method.display_bank} · </span>}
                      <span>Added {dateOnly(method.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Card Actions */}
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!isDefault && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSetDefault(method)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy ? "Updating…" : "Set as default"}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setDeletingMethod(method);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded-lg border border-transparent text-on-surface-variant hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete payment method"
                      aria-label={`Delete card ending in ${method.display_last4}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Card Modal */}
      <Modal
        open={showAddModal}
        onOpenChange={(open) => {
          if (addStage !== "authorizing" && addStage !== "confirming") {
            setShowAddModal(open);
          }
        }}
        title="Add Payment Method"
        description="Verify and securely link a new credit or debit card for Autopay."
        width="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>RBI e-Mandate Verification</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              Your card will be authenticated via Razorpay 3D Secure. A nominal ₹1–₹2 authorization
              hold may appear on your bank statement and will be refunded automatically.
            </p>
          </div>

          {addStage === "error" && addError && (
            <div className="space-y-2">
              <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {addError}
              </div>
              <button
                type="button"
                onClick={() => void handleAuthorizeDevCard()}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>⚡ Authorize with Test Card (Dev / Test Mode)</span>
              </button>
            </div>
          )}

          {addStage === "success" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>Payment method verified and added successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              disabled={addStage === "authorizing" || addStage === "confirming"}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={addStage === "authorizing" || addStage === "confirming" || addStage === "success"}
              onClick={() => void handleStartAddCard()}
              style={{ background: "#4f46e5", color: "#ffffff" }}
            >
              {addStage === "authorizing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Opening verification…</span>
                </>
              ) : addStage === "confirming" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Saving card…</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-1.5" />
                  <span>Authenticate Card</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        tone="danger"
        title="Remove Payment Method?"
        message={`Are you sure you want to remove the card ending in •••• ${deletingMethod?.display_last4 || "••••"}?`}
        confirmText="Remove Card"
        cancelText="Keep Card"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingMethod(null);
        }}
      />
    </div>
  );
}

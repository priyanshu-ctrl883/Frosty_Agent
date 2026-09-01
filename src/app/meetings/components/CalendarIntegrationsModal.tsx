"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, KeyRound, Lock, Mail, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/lib/workspace";
import type { CalendarStatus } from "@/lib/types";
import styles from "../meetings.module.css";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: CalendarStatus | null;
  calBusy: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onConnectCalendly: (email: string, token: string) => Promise<void>;
  onDisconnectCalendly: () => void;
};

export function CalendarIntegrationsModal({
  open,
  onOpenChange,
  status,
  calBusy,
  onConnectGoogle,
  onDisconnectGoogle,
  onConnectCalendly,
  onDisconnectCalendly,
}: Props) {
  const { allowed, isOverride } = useWorkspace();
  const googleConn = status?.connections.find((c) => c.provider === "google");
  const calendlyConn = status?.connections.find((c) => c.provider === "calendly");

  const [calendlyEmail, setCalendlyEmail] = useState("");
  const [calendlyToken, setCalendlyToken] = useState("");

  const hasAnyActive = Boolean(googleConn?.connected || calendlyConn?.connected);
  const canAddMultiple = allowed("multi_calendar");

  async function handleCalendlySubmit(e: FormEvent) {
    e.preventDefault();
    if (!calendlyEmail.trim() || !calendlyToken.trim()) return;
    await onConnectCalendly(calendlyEmail.trim(), calendlyToken.trim());
    setCalendlyToken("");
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Calendar Integrations"
      description="Connect your business calendars to automatically generate Google Meet links and sync appointment bookings."
      width="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Google Calendar Card */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>

          <div className={styles.integrationInfo}>
            <div className={styles.integrationTitle}>Google Account (Calendar &amp; Gmail)</div>
            <div className={styles.integrationDesc}>
              {googleConn?.connected
                ? `Connected as ${googleConn.email || "Google Account"}. Calendar bookings sync automatically. Quotation emails send from this Gmail once the Gmail API is enabled on the Google Cloud project used for OAuth — until then they go from Frostrek mail.`
                : "Connect your Google account to sync meetings, send calendar invites, and send quotation & follow-up emails from your Gmail address."}
            </div>

            {googleConn?.connected ? (
              <div className="flex items-center gap-1 text-[12px] font-bold text-[#0396A6] mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected &amp; Active
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[12px] text-[#8B847B] mt-1">
                <X className="w-3.5 h-3.5" /> Not connected
              </div>
            )}
          </div>

          <div>
            {googleConn?.connected ? (
              <Button
                type="button"
                variant="ghost"
                loading={calBusy}
                onClick={onDisconnectGoogle}
              >
                Disconnect
              </Button>
            ) : !calendlyConn?.connected || canAddMultiple ? (
              <Button type="button" loading={calBusy} onClick={onConnectGoogle}>
                Connect Google
              </Button>
            ) : (
              <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold inline-flex items-center gap-1">
                <Lock size={12} /> Locked
              </span>
            )}
          </div>
        </div>

        {/* Calendly Card */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationIcon}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4ZM24 11.5C17.0964 11.5 11.5 17.0964 11.5 24C11.5 30.9036 17.0964 36.5 24 36.5C28.1405 36.5 31.8103 34.4892 34.0883 31.392L29.462 28.4572C28.1122 30.0888 26.166 31.125 24 31.125C20.065 31.125 16.875 27.935 16.875 24C16.875 20.065 20.065 16.875 24 16.875C26.166 16.875 28.1122 17.9112 29.462 19.5428L34.0883 16.608C31.8103 13.5108 28.1405 11.5 24 11.5Z"
                fill="#006BFF"
              />
              <circle cx="24" cy="24" r="4.25" fill="#006BFF" />
            </svg>
          </div>

          <div className={styles.integrationInfo}>
            <div className={styles.integrationTitle}>Calendly</div>
            <div className={styles.integrationDesc}>
              {calendlyConn?.connected
                ? `Connected as ${calendlyConn.email}. Single-use Calendly links are used when Meet links are absent.`
                : "Connect your Calendly account using a Personal Access Token (PAT)."}
            </div>

            {calendlyConn?.connected ? (
              <div className="flex items-center gap-1 text-[12px] font-bold text-[#0396A6] mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[12px] text-[#8B847B] mt-1">
                <X className="w-3.5 h-3.5" /> Not connected
              </div>
            )}
          </div>

          <div>
            {calendlyConn?.connected && (
              <Button
                type="button"
                variant="ghost"
                loading={calBusy}
                onClick={onDisconnectCalendly}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Locked banner inside modal when user has 1 connection and multi_calendar is locked */}
        {hasAnyActive && !canAddMultiple && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  {isOverride("multi_calendar") ? "Multi-Calendar Disabled" : "Multi-Calendar Locked"}
                </div>
                <p className="text-[11px] text-amber-800 m-0 mt-0.5 leading-normal">
                  {isOverride("multi_calendar")
                    ? "Connecting multiple calendar accounts has been switched off for this workspace by Frostrek."
                    : "Connecting multiple calendars simultaneously requires the Multi Calendar entitlement."}
                </p>
              </div>
            </div>
            {!isOverride("multi_calendar") && (
              <Link
                href="/billing"
                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold whitespace-nowrap no-underline shadow-2xs transition-all"
              >
                See plans
              </Link>
            )}
          </div>
        )}

        {/* Calendly Connect Form (if disconnected and entitled or no other calendar active) */}
        {!calendlyConn?.connected && (!hasAnyActive || canAddMultiple) && (
          <form
            onSubmit={handleCalendlySubmit}
            className="p-4 bg-[#EAF8F8] border border-[#D9EDEE] rounded-xl flex flex-col gap-3"
          >
            <div className="text-[13px] font-bold text-[#111827]">
              Connect Calendly Account
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={styles.modalLabel}>Calendly Email</label>
                <input
                  type="email"
                  className={styles.modalInput}
                  value={calendlyEmail}
                  onChange={(e) => setCalendlyEmail(e.target.value)}
                  placeholder="your-account@company.com"
                  required
                />
              </div>
              <div>
                <label className={styles.modalLabel}>Personal Access Token</label>
                <input
                  type="password"
                  className={styles.modalInput}
                  value={calendlyToken}
                  onChange={(e) => setCalendlyToken(e.target.value)}
                  placeholder="eyJraWQi..."
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={calBusy}
                disabled={!calendlyEmail.trim() || !calendlyToken.trim()}
              >
                <KeyRound className="w-4 h-4" /> Save &amp; Connect Calendly
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { FollowUpSettings } from "@/lib/types";
import styles from "./FollowUpSettingsPanel.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (body: Partial<FollowUpSettings>) => Promise<void>;
  initial: FollowUpSettings | null;
};

export function FollowUpSettingsPanel({ open, onClose, onSave, initial }: Props) {
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [stepDays, setStepDays] = useState("0, 3, 7, 14");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [waBody, setWaBody] = useState("");
  const [channelsEmail, setChannelsEmail] = useState(true);
  const [channelsWa, setChannelsWa] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setAutoEnabled(initial.auto_enabled);
    setStepDays(initial.step_days.join(", "));
    setEmailSubject(initial.email_subject_template);
    setEmailBody(initial.email_body_template);
    setWaBody(initial.whatsapp_body_template);
    setChannelsEmail(initial.channels.includes("email"));
    setChannelsWa(initial.channels.includes("whatsapp"));
  }, [initial, open]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const days = stepDays
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    if (!days.length) {
      setError("Enter at least one day offset (e.g. 0, 3, 7, 14).");
      setBusy(false);
      return;
    }
    const channels: ("email" | "whatsapp")[] = [];
    if (channelsEmail) channels.push("email");
    if (channelsWa) channels.push("whatsapp");
    if (!channels.length) {
      setError("Select at least one channel.");
      setBusy(false);
      return;
    }
    try {
      await onSave({
        auto_enabled: autoEnabled,
        step_days: days,
        channels,
        email_subject_template: emailSubject,
        email_body_template: emailBody,
        whatsapp_body_template: waBody,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Follow-up settings">
      <form className={styles.panel} onSubmit={(e) => void onSubmit(e)}>
        <header className={styles.header}>
          <h2>Follow-up settings</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <p className={styles.hint}>
          Automated drip runs after each new lead. Days are gaps between steps (0 = immediate first
          touch). Use {"{{name}}"}, {"{{interest}}"}, and {"{{chat_summary}}"} in templates.
          {"{{chat_summary}}"} comes from the linked chat summary or recent messages.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={autoEnabled}
            onChange={(e) => setAutoEnabled(e.target.checked)}
          />
          Enable automated follow-up on new leads
        </label>
        <Field
          label="Step days (comma-separated)"
          name="step_days"
          value={stepDays}
          onChange={setStepDays}
        />
        <div className={styles.channels}>
          <label className={styles.check}>
            <input type="checkbox" checked={channelsEmail} onChange={(e) => setChannelsEmail(e.target.checked)} />
            Email
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={channelsWa} onChange={(e) => setChannelsWa(e.target.checked)} />
            WhatsApp
          </label>
        </div>
        <Field label="Email subject" name="email_subject" value={emailSubject} onChange={setEmailSubject} />
        <label className={styles.area}>
          <span>Email body</span>
          <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
        </label>
        <label className={styles.area}>
          <span>WhatsApp message</span>
          <textarea value={waBody} onChange={(e) => setWaBody(e.target.value)} rows={3} />
        </label>
        <footer className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

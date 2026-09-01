"use client";

import React, { FormEvent, useState, useEffect } from "react";
import { CalendarCheck, Clock, Globe } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toLocalInputValue } from "@/lib/format";
import styles from "../meetings.module.css";

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

type CreateMeetingPayload = {
  title: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  scheduled_start: string;
  scheduled_end: string;
  durationMin: number;
  description: string | null;
  notes: string | null;
  timezone: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onCreate: (payload: CreateMeetingPayload) => Promise<void>;
  initialDate?: Date | null;
};

export function NewMeetingModal({
  open,
  onOpenChange,
  busy,
  onCreate,
  initialDate,
}: Props) {
  const [title, setTitle] = useState("Discovery call");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [durationMin, setDurationMin] = useState<number>(30);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      const d = initialDate || new Date();
      if (!initialDate) {
        // Default to next nearest 30m slot
        d.setMinutes(d.getMinutes() + 30 - (d.getMinutes() % 30), 0, 0);
      }
      setStartLocal(toLocalInputValue(d.toISOString()));
    }
  }, [open, initialDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startLocal) return;

    const startDate = new Date(startLocal);
    const endDate = new Date(startDate.getTime() + durationMin * 60_000);

    await onCreate({
      title,
      attendee_name: attendeeName.trim() || null,
      attendee_email: attendeeEmail.trim() || null,
      attendee_phone: attendeePhone.trim() || null,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      durationMin,
      description: description.trim() || null,
      notes: notes.trim() || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // Reset fields on success
    setTitle("Discovery call");
    setAttendeeName("");
    setAttendeeEmail("");
    setAttendeePhone("");
    setDescription("");
    setNotes("");
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule New Meeting"
      description="Manually book an appointment. If Google Calendar is connected, invitations and Meet links are created automatically."
      width="md"
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="new-meeting-form" loading={busy}>
            <CalendarCheck className="w-4 h-4" /> Create &amp; Schedule
          </Button>
        </div>
      }
    >
      <form id="new-meeting-form" className={styles.modalForm} onSubmit={handleSubmit}>
        <Field
          label="Meeting Title"
          name="title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Discovery call, Product demo"
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="Attendee Name"
            name="attendee_name"
            value={attendeeName}
            onChange={setAttendeeName}
            placeholder="John Doe"
          />
          <Field
            label="Attendee Phone"
            name="attendee_phone"
            value={attendeePhone}
            onChange={setAttendeePhone}
            placeholder="+91 98765 43210"
          />
        </div>

        <Field
          label="Attendee Email (for Calendar Invite)"
          name="attendee_email"
          type="email"
          value={attendeeEmail}
          onChange={setAttendeeEmail}
          placeholder="client@example.com"
        />

        {/* Start Date Time */}
        <div>
          <label className={styles.modalLabel}>Start Date &amp; Time (Local)</label>
          <input
            type="datetime-local"
            className={styles.modalInput}
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            required
          />
          <span className="text-[11px] text-[#8B847B] inline-flex items-center gap-1 mt-1">
            <Globe className="w-3 h-3" /> Timezone:{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </div>

        {/* Duration selector */}
        <div>
          <label className={styles.modalLabel}>Duration</label>
          <div className={styles.durationSelect}>
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={
                  durationMin === d ? styles.durationOptionActive : styles.durationOption
                }
                onClick={() => setDurationMin(d)}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={styles.modalLabel}>Description / Agenda (Optional)</label>
          <textarea
            className={`${styles.modalTextarea} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key discussion topics or notes for the invite..."
            style={{ resize: 'none' }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={styles.modalLabel}>Internal Notes (Optional)</label>
          <textarea
            className={`${styles.modalTextarea} resize-none`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes for your team only..."
            style={{ minHeight: 60, resize: 'none' }}
          />
        </div>
      </form>
    </Modal>
  );
}

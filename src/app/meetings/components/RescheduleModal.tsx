"use client";

import React, { FormEvent, useState, useEffect } from "react";
import { CalendarClock, Clock, Globe } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatWhen, toLocalInputValue } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import styles from "../meetings.module.css";

type Props = {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onReschedule: (id: string, newStartIso: string, newEndIso: string) => Promise<void>;
};

export function RescheduleModal({
  meeting,
  open,
  onOpenChange,
  busy,
  onReschedule,
}: Props) {
  const [newStartLocal, setNewStartLocal] = useState("");

  useEffect(() => {
    if (meeting && open) {
      setNewStartLocal(toLocalInputValue(meeting.scheduled_start));
    }
  }, [meeting, open]);

  if (!meeting) return null;

  const currentDurationMs =
    new Date(meeting.scheduled_end).getTime() - new Date(meeting.scheduled_start).getTime();
  const currentDurationMin = Math.round(currentDurationMs / 60_000);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!meeting || !newStartLocal) return;

    const startDate = new Date(newStartLocal);
    const endDate = new Date(startDate.getTime() + currentDurationMs);

    await onReschedule(meeting.id, startDate.toISOString(), endDate.toISOString());
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reschedule Meeting"
      description="Select a new date and time for this booking. The attendee will receive updated calendar invites automatically."
      width="sm"
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="reschedule-form"
            loading={busy}
            disabled={!newStartLocal}
          >
            <CalendarClock className="w-4 h-4" /> Save New Time
          </Button>
        </div>
      }
    >
      <form id="reschedule-form" className={styles.modalForm} onSubmit={handleSubmit}>
        {/* Current Info */}
        <div className={styles.drawerCard}>
          <div className="font-bold text-[14px] text-[#111827]">{meeting.title}</div>
          <div className="text-[12px] text-[#666056]">
            Attendee: <strong>{meeting.attendee_name || meeting.attendee_email || "Customer"}</strong>
          </div>
          <div className="text-[12px] text-[#8B847B] flex items-center gap-1.5 pt-1 border-t border-[#D9EDEE]">
            <Clock className="w-3.5 h-3.5" />
            Currently: {formatWhen(meeting.scheduled_start, meeting.timezone)} ({currentDurationMin} min)
          </div>
        </div>

        {/* New Date Time Picker */}
        <div>
          <label className={styles.modalLabel}>New Scheduled Start (Local Time)</label>
          <input
            type="datetime-local"
            className={styles.modalInput}
            value={newStartLocal}
            onChange={(e) => setNewStartLocal(e.target.value)}
            required
          />
          <span className="text-[11px] text-[#8B847B] inline-flex items-center gap-1 mt-1">
            <Globe className="w-3 h-3" /> Duration will remain {currentDurationMin} minutes
          </span>
        </div>
      </form>
    </Modal>
  );
}
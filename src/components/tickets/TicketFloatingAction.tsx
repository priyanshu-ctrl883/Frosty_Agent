"use client";

import React, { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { CreateTicketModal } from "./CreateTicketModal";
import styles from "./tickets.module.css";

export function TicketFloatingAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.fabWrapper}>
        <button
          type="button"
          className={styles.fabButton}
          onClick={() => setOpen(true)}
          title="Raise Support Ticket / Report Issue"
          aria-label="Raise Support Ticket"
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          <span>Report Issue</span>
        </button>
      </div>

      <CreateTicketModal open={open} onOpenChange={setOpen} />
    </>
  );
}

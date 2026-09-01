"use client";

import styles from "./inbox.module.css";

export type InboxChannelFilter = "all" | "whatsapp" | "website";

type Props = {
  value: InboxChannelFilter;
  onChange: (next: InboxChannelFilter) => void;
  className?: string;
};

const PILL_CONFIG: { id: InboxChannelFilter; label: string; activeClass: string }[] = [
  { id: "all", label: "All", activeClass: styles.sidebarChannelPillActive ?? "" },
  { id: "whatsapp", label: "WhatsApp", activeClass: styles.sidebarChannelPillActiveWhatsapp ?? "" },
  { id: "website", label: "Website", activeClass: styles.sidebarChannelPillActive ?? "" },
];

export function InboxChannelFilterPills({ value, onChange, className = "" }: Props) {
  return (
    <div className={`${styles.sidebarChannelFilterRow} ${className}`.trim()} role="tablist" aria-label="Filter by channel">
      {PILL_CONFIG.map(({ id, label, activeClass }) => {
        const isActive = value === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`${styles.sidebarChannelPill} ${isActive ? activeClass : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

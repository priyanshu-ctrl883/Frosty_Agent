"use client";

import { User as UserIcon } from "lucide-react";
import {
  getInboxInitials,
  shouldUseInboxUserIcon,
  type InboxChannel,
} from "./inboxDisplay";
import styles from "./inbox.module.css";
import { cn } from "@/lib/utils";

type Props = {
  contactLabel: string | null | undefined;
  channel: InboxChannel;
  className?: string;
  compact?: boolean;
};

export const InboxContactAvatar = ({
  contactLabel,
  channel,
  className,
  compact = false,
}: Props) => {
  const useUserIcon = shouldUseInboxUserIcon(contactLabel, channel);
  const displayLabel = contactLabel?.trim() || "Visitor";

  if (useUserIcon) {
    return (
      <div
        className={cn(
          styles.cardAvatar,
          styles.avatarTeal,
          styles.inboxProfileIcon,
          compact ? styles.inboxProfileIconCompact : styles.inboxProfileIconDefault,
          className,
        )}
      >
        <UserIcon size={compact ? 14 : 18} strokeWidth={2.5} className="text-[#0A1A2F]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        styles.cardAvatar,
        styles.avatarTeal,
        compact ? styles.inboxProfileIconCompact : styles.inboxProfileIconDefault,
        className,
      )}
    >
      {getInboxInitials(displayLabel)}
    </div>
  );
};

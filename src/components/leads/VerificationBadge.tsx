"use client";

import {
  REACHABLE_OWNERSHIP_NOTE,
  VERIFICATION_BADGE_CLASS,
  VERIFICATION_HELP,
  VERIFICATION_LABEL,
  normalizeVerificationGrade,
} from "@/lib/leads/verification";

type Props = {
  grade?: string | null;
  /** Show longer title including honesty note for reachable. */
  showHonestyInTitle?: boolean;
  className?: string;
};

export const VerificationBadge = ({
  grade,
  showHonestyInTitle = true,
  className = "",
}: Props) => {
  const g = normalizeVerificationGrade(grade);
  const cls = VERIFICATION_BADGE_CLASS[g] || VERIFICATION_BADGE_CLASS.unverified;
  const label = VERIFICATION_LABEL[g] || g.replace(/_/g, " ");
  let title = VERIFICATION_HELP[g] || label;
  if (showHonestyInTitle && g === "reachable") {
    title = `${title} ${REACHABLE_OWNERSHIP_NOTE}`;
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
};

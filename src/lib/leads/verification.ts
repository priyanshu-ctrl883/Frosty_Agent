/** Graded lead verification (Phase 1 – no OTP). Single best-wins grade. */

export type VerificationGrade =
  | "unverified"
  | "format_valid"
  | "channel_verified"
  | "email_verified"
  | "reachable";

export const VERIFICATION_GRADES: VerificationGrade[] = [
  "reachable",
  "email_verified",
  "channel_verified",
  "format_valid",
  "unverified",
];

/** Coloured pill classes — keep list + detail in sync. */
export const VERIFICATION_BADGE_CLASS: Record<string, string> = {
  reachable: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  email_verified: "bg-teal-500/10 text-teal-700 border-teal-500/25",
  channel_verified: "bg-sky-500/10 text-sky-700 border-sky-500/25",
  format_valid: "bg-amber-500/10 text-amber-700 border-amber-500/25",
  unverified: "bg-muted text-muted-foreground border-border",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  reachable: "Reachable",
  email_verified: "Email verified",
  channel_verified: "Channel verified",
  format_valid: "Format valid",
  unverified: "Unverified",
};

/** Merchant-facing tooltip / help for each grade. */
export const VERIFICATION_HELP: Record<string, string> = {
  unverified:
    "No strong signal yet — phone missing, invalid, or obvious junk, and no WhatsApp/email confirmation.",
  format_valid:
    "Phone matches a plausible Indian mobile format (not proof of ownership).",
  channel_verified:
    "Lead arrived on WhatsApp — Meta already verified the number can message.",
  email_verified:
    "Visitor confirmed their email via the confirm link (when email verification is enabled).",
  reachable:
    "A WhatsApp message to this number was delivered or read. The number exists on WhatsApp — it does not guarantee the person who submitted the form owns it.",
};

/** Short honesty line for Settings and detail pages. */
export const REACHABLE_OWNERSHIP_NOTE =
  "Reachable means the number exists on WhatsApp. It does not guarantee that the person who submitted the form owns the number.";

/**
 * Merchant-readable signals for the current best-wins grade.
 * (Only the winning grade is stored — earlier lower grades are not retained.)
 */
export const signalsForGrade = (grade: string | null | undefined): string[] => {
  switch (normalizeVerificationGrade(grade)) {
    case "reachable":
      return ["Reachable on WhatsApp (delivery or read receipt)"];
    case "email_verified":
      return ["Email confirmed via confirm link"];
    case "channel_verified":
      return ["WhatsApp channel verified"];
    case "format_valid":
      return ["Phone format looks valid (Indian mobile)"];
    default:
      return ["No verification signals yet"];
  }
};

export const normalizeVerificationGrade = (
  grade: string | null | undefined,
): VerificationGrade => {
  const g = (grade || "unverified") as VerificationGrade;
  return VERIFICATION_GRADES.includes(g) ? g : "unverified";
};


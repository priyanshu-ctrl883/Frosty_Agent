import Link from "next/link";
import { Button } from "@/components/ui/Button";
import styles from "./PageState.module.css";

type Props = {
  icon?: string;
  title: string;
  description: string;
  tone?: "neutral" | "error";
  /** Why the door is shut, when that is a plan fact rather than a role fact. */
  lockedReason?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** A non-Link action, for the empty states whose first move is a dialog rather than a route. */
  action?: React.ReactNode;
  card?: boolean;
};

/**
 * The empty / refused / soft-locked state.
 *
 * Ported from the parallel build's version, which is better than the Frostrek dashboard's on the
 * two things that matter for a MERCHANT screen: it carries an upgrade CTA, and it separates the
 * refusal from its REASON (`lockedReason`). The Master asks for exactly that — "Soft lock — 'Not on
 * your plan. Contact support / upgrade.' **Never silent fail**" — and a refusal with no next step
 * is a silent fail with a nicer font.
 */
export function PageState({
  icon,
  title,
  description,
  tone = "neutral",
  lockedReason,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  action,
  card = true,
}: Props) {
  const base = card ? styles.card : styles.wrap;
  return (
    <section className={tone === "error" ? `${base} ${styles.error}` : base}>
      {icon ? (
        <div className={styles.icon} aria-hidden>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      ) : null}
      <h2>{title}</h2>
      <p>{description}</p>
      {lockedReason ? <p className={styles.lock}>{lockedReason}</p> : null}
      {primaryHref || secondaryHref || action ? (
        <div className={styles.actions}>
          {primaryHref && primaryLabel ? (
            <Link href={primaryHref}>
              <Button>{primaryLabel}</Button>
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button variant="ghost">{secondaryLabel}</Button>
            </Link>
          ) : null}
          {action}
        </div>
      ) : null}
    </section>
  );
}

/** The three states every data screen has. Kept together so no screen invents a fourth. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className={styles.inline} role="status">
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.errorBox} role="alert">
      <span className="material-symbols-outlined" aria-hidden>
        error
      </span>
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return <div className={styles.inline}>{message}</div>;
}

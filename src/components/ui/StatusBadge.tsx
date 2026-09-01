import styles from "./StatusBadge.module.css";

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "pine" | "warm" | "purple";

type Props = {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
};

export function StatusBadge({ label, tone = "neutral", dot = false, className }: Props) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")}>
      {dot ? <span className={styles.dot} aria-hidden /> : null}
      <span>{label}</span>
    </span>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { columnLabel } from "@/lib/leads/columns";
import type { LeadCustomField, TableColumnPref } from "@/lib/types";
import styles from "./ExportModal.module.css";

type Props = {
  open: boolean;
  columns: TableColumnPref[];
  customFields: LeadCustomField[];
  rowCount: number;
  busy: boolean;
  onClose: () => void;
  onExport: () => void;
};

export function ExportModal({
  open,
  columns,
  customFields,
  rowCount,
  busy,
  onClose,
  onExport,
}: Props) {
  if (!open) return null;

  const visible = columns.filter((c) => c.visible);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
        <h2>Export leads</h2>
        <p className={styles.sub}>
          Downloads a CSV with your current visible columns and active filters (up to 5,000 rows).
        </p>
        <ul className={styles.cols}>
          {visible.map((c) => (
            <li key={c.key}>{columnLabel(c, customFields)}</li>
          ))}
        </ul>
        <p className={styles.meta}>Matching rows: {rowCount}+ (server cap 5,000)</p>
        <div className={styles.actions}>
          <Button type="button" loading={busy} onClick={onExport}>
            Download CSV
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

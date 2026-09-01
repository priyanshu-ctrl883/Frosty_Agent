import type { LeadCustomField, TableColumnPref } from "@/lib/types";

export type SystemColumnDef = {
  key: string;
  label: string;
  kind: "system";
  defaultVisible: boolean;
  defaultWidth: number;
  sortable?: boolean;
};

export const SYSTEM_COLUMNS: SystemColumnDef[] = [
  { key: "name", label: "Name", kind: "system", defaultVisible: true, defaultWidth: 160 },
  { key: "email", label: "Email", kind: "system", defaultVisible: true, defaultWidth: 180 },
  { key: "phone", label: "Phone", kind: "system", defaultVisible: true, defaultWidth: 140 },
  { key: "interest", label: "Interest", kind: "system", defaultVisible: true, defaultWidth: 200 },
  { key: "temperature", label: "Temp", kind: "system", defaultVisible: true, defaultWidth: 110 },
  { key: "score", label: "Score", kind: "system", defaultVisible: true, defaultWidth: 80 },
  { key: "status", label: "Status", kind: "system", defaultVisible: true, defaultWidth: 130 },
  { key: "verification_grade", label: "Verify", kind: "system", defaultVisible: true, defaultWidth: 130 },
  { key: "source", label: "Source", kind: "system", defaultVisible: true, defaultWidth: 100 },
  { key: "channel", label: "Channel", kind: "system", defaultVisible: false, defaultWidth: 100 },
  { key: "budget", label: "Budget", kind: "system", defaultVisible: false, defaultWidth: 120 },
  { key: "created_at", label: "Created", kind: "system", defaultVisible: false, defaultWidth: 160 },
];

export function defaultTableColumns(): TableColumnPref[] {
  return SYSTEM_COLUMNS.map((c, i) => ({
    key: c.key,
    visible: c.defaultVisible,
    width: c.defaultWidth,
    order: i,
    label_override: null,
  }));
}

export function mergeTableColumns(
  prefs: TableColumnPref[] | undefined,
  customFields: LeadCustomField[],
): TableColumnPref[] {
  const byKey = new Map<string, TableColumnPref>();
  for (const c of prefs?.length ? prefs : defaultTableColumns()) {
    byKey.set(c.key, { ...c });
  }
  for (const def of SYSTEM_COLUMNS) {
    if (!byKey.has(def.key)) {
      byKey.set(def.key, {
        key: def.key,
        visible: def.defaultVisible,
        width: def.defaultWidth,
        order: byKey.size,
        label_override: null,
      });
    }
  }
  customFields.forEach((f, i) => {
    const key = `cf:${f.field_key}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        visible: false,
        width: 140,
        order: SYSTEM_COLUMNS.length + i,
        label_override: null,
      });
    }
  });
  return [...byKey.values()].sort((a, b) => a.order - b.order);
}

export function columnLabel(col: TableColumnPref, customFields: LeadCustomField[]): string {
  if (col.label_override?.trim()) return col.label_override.trim();
  if (col.key.startsWith("cf:")) {
    const cf = customFields.find((f) => `cf:${f.field_key}` === col.key);
    return cf?.label ?? col.key.slice(3);
  }
  return SYSTEM_COLUMNS.find((c) => c.key === col.key)?.label ?? col.key;
}

export function leadCellValue(
  lead: import("@/lib/types").Lead,
  key: string,
): string {
  if (key.startsWith("cf:")) {
    const v = lead.custom_fields?.[key.slice(3)];
    if (v == null || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  }
  const val = (lead as Record<string, unknown>)[key];
  if (val == null || val === "") return "—";
  if (key === "created_at" || key === "updated_at") {
    try {
      return new Date(String(val)).toLocaleString();
    } catch {
      return String(val);
    }
  }
  return String(val);
}

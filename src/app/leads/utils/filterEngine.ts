import type { Lead } from "@/lib/types";
import type {
  ColumnId,
  CustomFieldDef,
  DynamicFilterRule,
  FilterColumnMetadata,
  FilterFieldType,
  FilterOperator,
  OperatorDefinition,
} from "../types/filter";

/* ─── Operator Definitions by Field Type ─── */

export const OPERATORS_BY_TYPE: Record<FilterFieldType, OperatorDefinition[]> = {
  text: [
    { label: "contains", operator: "contains", requiresValue: true },
    { label: "does not contain", operator: "not_contains", requiresValue: true },
    { label: "equals", operator: "equals", requiresValue: true },
    { label: "starts with", operator: "starts_with", requiresValue: true },
    { label: "ends with", operator: "ends_with", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  email: [
    { label: "contains", operator: "contains", requiresValue: true },
    { label: "does not contain", operator: "not_contains", requiresValue: true },
    { label: "equals", operator: "equals", requiresValue: true },
    { label: "starts with", operator: "starts_with", requiresValue: true },
    { label: "ends with", operator: "ends_with", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  phone: [
    { label: "contains", operator: "contains", requiresValue: true },
    { label: "equals", operator: "equals", requiresValue: true },
    { label: "starts with", operator: "starts_with", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  number: [
    { label: "equals (=)", operator: "equals", requiresValue: true },
    { label: "not equals (≠)", operator: "not_equals", requiresValue: true },
    { label: "greater than (>)", operator: "greater_than", requiresValue: true },
    { label: "greater than or equal (≥)", operator: "greater_than_or_equal", requiresValue: true },
    { label: "less than (<)", operator: "less_than", requiresValue: true },
    { label: "less than or equal (≤)", operator: "less_than_or_equal", requiresValue: true },
    { label: "between", operator: "between", requiresDualValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  currency: [
    { label: "equals (=)", operator: "equals", requiresValue: true },
    { label: "not equals (≠)", operator: "not_equals", requiresValue: true },
    { label: "greater than (>)", operator: "greater_than", requiresValue: true },
    { label: "greater than or equal (≥)", operator: "greater_than_or_equal", requiresValue: true },
    { label: "less than (<)", operator: "less_than", requiresValue: true },
    { label: "less than or equal (≤)", operator: "less_than_or_equal", requiresValue: true },
    { label: "between", operator: "between", requiresDualValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  select: [
    { label: "is", operator: "is", requiresValue: true },
    { label: "is not", operator: "is_not", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  radio: [
    { label: "is", operator: "is", requiresValue: true },
    { label: "is not", operator: "is_not", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  multi_select: [
    { label: "contains any of", operator: "contains_any", requiresMultiValue: true },
    { label: "contains all of", operator: "contains_all", requiresMultiValue: true },
    { label: "does not contain", operator: "does_not_contain", requiresMultiValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  checkbox: [
    { label: "is", operator: "is", requiresValue: true },
  ],
  date: [
    { label: "is", operator: "is", requiresValue: true },
    { label: "before (<)", operator: "before", requiresValue: true },
    { label: "after (>)", operator: "after", requiresValue: true },
    { label: "between", operator: "between", requiresDualValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  datetime: [
    { label: "is", operator: "is", requiresValue: true },
    { label: "before (<)", operator: "before", requiresValue: true },
    { label: "after (>)", operator: "after", requiresValue: true },
    { label: "between", operator: "between", requiresDualValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
  url: [
    { label: "contains", operator: "contains", requiresValue: true },
    { label: "does not contain", operator: "not_contains", requiresValue: true },
    { label: "equals", operator: "equals", requiresValue: true },
    { label: "starts with", operator: "starts_with", requiresValue: true },
    { label: "is empty", operator: "is_empty", requiresValue: false },
    { label: "is not empty", operator: "is_not_empty", requiresValue: false },
  ],
};

/* ─── Standard Column Metadata Map ─── */

export const STANDARD_COLUMN_METADATA: Record<string, FilterColumnMetadata> = {
  name: { id: "name", label: "Lead", type: "text" },
  email: { id: "email", label: "Email", type: "email" },
  phone: { id: "phone", label: "Phone", type: "phone" },
  interest: { id: "interest", label: "Interest", type: "text" },
  budget: { id: "budget", label: "Budget", type: "currency", currencySymbol: "₹" },
  temperature: {
    id: "temperature",
    label: "Temperature",
    type: "select",
    options: [
      { value: "hot", label: "HOT", color: "#f43f5e" },
      { value: "warm", label: "WARM", color: "#f59e0b" },
      { value: "cold", label: "COLD", color: "#3b82f6" },
    ],
  },
  score: { id: "score", label: "Score", type: "number" },
  status: {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "new", label: "New", color: "#3b82f6" },
      { value: "contacted", label: "Contacted", color: "#8b5cf6" },
      { value: "qualified", label: "Qualified", color: "#10b981" },
      { value: "converted", label: "Converted", color: "#059669" },
      { value: "lost", label: "Lost", color: "#64748b" },
    ],
  },
  verification_grade: {
    id: "verification_grade",
    label: "Verification",
    type: "select",
    options: [
      {
        value: "reachable",
        label: "Reachable",
        color: "#059669",
        title:
          "WhatsApp delivery/read receipt — number exists on WhatsApp; not proof of form ownership",
      },
      {
        value: "email_verified",
        label: "Email verified",
        color: "#10b981",
        title: "Visitor confirmed email via confirm link",
      },
      {
        value: "channel_verified",
        label: "Channel verified",
        color: "#3b82f6",
        title: "Arrived on WhatsApp — Meta possession of the number",
      },
      {
        value: "format_valid",
        label: "Format valid",
        color: "#f59e0b",
        title: "Plausible Indian mobile format (not ownership)",
      },
      {
        value: "unverified",
        label: "Unverified",
        color: "#64748b",
        title: "No strong verification signal yet",
      },
    ],
  },
  source: {
    id: "source",
    label: "Source",
    type: "select",
    options: [
      { value: "chat", label: "Chat" },
      { value: "manual", label: "Manual" },
      { value: "website", label: "Website" },
    ],
  },
  channel: {
    id: "channel",
    label: "Channel",
    type: "select",
    options: [
      { value: "website", label: "Website" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
  },
  follow_up_sent: {
    id: "follow_up_sent",
    label: "Follow-up Sent",
    type: "checkbox",
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
  },
  created_at: { id: "created_at", label: "Created At", type: "datetime" },
  updated_at: { id: "updated_at", label: "Updated At", type: "datetime" },
};

/* ─── Helper to build metadata for custom columns ─── */

export function getColumnMetadata(
  colId: ColumnId,
  customFields: CustomFieldDef[],
): FilterColumnMetadata | null {
  if (colId === "actions") return null;

  if (STANDARD_COLUMN_METADATA[colId]) {
    return STANDARD_COLUMN_METADATA[colId];
  }

  const custom = customFields.find(
    (cf) =>
      cf.id === colId ||
      cf.key === colId ||
      cf.name.toLowerCase() === String(colId).toLowerCase(),
  );
  if (custom) {
    let filterType: FilterFieldType = "text";
    switch (custom.type) {
      case "textarea":
        filterType = "text";
        break;
      case "number":
        filterType = "number";
        break;
      case "currency":
        filterType = "currency";
        break;
      case "checkbox":
        filterType = "checkbox";
        break;
      case "select":
        filterType = "select";
        break;
      case "multi_select":
        filterType = "multi_select";
        break;
      case "radio":
        filterType = "radio";
        break;
      case "date":
        filterType = "date";
        break;
      case "datetime":
        filterType = "datetime";
        break;
      case "email":
        filterType = "email";
        break;
      case "phone":
        filterType = "phone";
        break;
      case "url":
        filterType = "url";
        break;
      default:
        filterType = "text";
    }

    const options = custom.options?.map((opt) => ({
      value: opt.label,
      label: opt.label,
      color: opt.color,
    }));

    return {
      id: custom.id,
      label: custom.name,
      type: filterType,
      options:
        filterType === "checkbox"
          ? [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]
          : options,
      currencySymbol: custom.currencySymbol,
      isCustom: true,
      customDef: custom,
    };
  }

  // Fallback for any dynamic column
  if (typeof colId === "string" && !STANDARD_COLUMN_METADATA[colId]) {
    return {
      id: colId,
      label: colId.replace(/^custom_\d+_/, "").replace(/_/g, " "),
      type: "text",
      isCustom: true,
    };
  }

  return null;
}

/* ─── Helper to get default operator for a column ─── */

export function getDefaultOperator(type: FilterFieldType): FilterOperator {
  const ops = OPERATORS_BY_TYPE[type];
  return ops?.[0]?.operator || "contains";
}

/* ─── Clean Numeric Parsing ─── */

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  const str = String(value).trim();
  // Strip currency symbols, commas, spaces
  const cleaned = str.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/* ─── Normalize Date for Comparison ─── */

export function parseDateTimestamp(value: unknown): number | null {
  if (!value) return null;
  try {
    const d = new Date(String(value));
    const time = d.getTime();
    return isNaN(time) ? null : time;
  } catch {
    return null;
  }
}

/* ─── Individual Rule Evaluator ─── */

export function evaluateFilterRule(
  lead: Lead,
  rule: DynamicFilterRule,
  customFields: CustomFieldDef[],
  leadCustomValues: Record<string, Record<string, unknown>>,
): boolean {
  const meta = getColumnMetadata(rule.columnId, customFields);
  if (!meta) return true; // Ignore if column metadata not found

  // Extract raw cell value
  let rawValue: unknown = undefined;
  if (meta.isCustom && meta.customDef) {
    const leadCustoms = leadCustomValues[String(lead.id)] || {};
    rawValue = leadCustoms[meta.customDef.key];
  } else {
    rawValue = (lead as unknown as Record<string, unknown>)[meta.id];
  }

  const op = rule.operator;
  const filterVal = (rule.value ?? "").trim().toLowerCase();
  const filterVal2 = (rule.value2 ?? "").trim().toLowerCase();

  // 1. Empty / Not Empty Checks
  if (op === "is_empty") {
    if (rawValue === null || rawValue === undefined || rawValue === "") return true;
    if (Array.isArray(rawValue) && rawValue.length === 0) return true;
    return false;
  }
  if (op === "is_not_empty") {
    if (rawValue === null || rawValue === undefined || rawValue === "") return false;
    if (Array.isArray(rawValue) && rawValue.length === 0) return false;
    return true;
  }

  // 2. Numeric / Currency / Score Types
  if (meta.type === "number" || meta.type === "currency") {
    const cellNum = parseNumber(rawValue);
    const targetNum = parseNumber(rule.value);
    const targetNum2 = parseNumber(rule.value2);

    if (cellNum === null) return false;

    switch (op) {
      case "equals":
        return targetNum !== null && cellNum === targetNum;
      case "not_equals":
        return targetNum !== null && cellNum !== targetNum;
      case "greater_than":
        return targetNum !== null && cellNum > targetNum;
      case "greater_than_or_equal":
        return targetNum !== null && cellNum >= targetNum;
      case "less_than":
        return targetNum !== null && cellNum < targetNum;
      case "less_than_or_equal":
        return targetNum !== null && cellNum <= targetNum;
      case "between":
        if (targetNum !== null && targetNum2 !== null) {
          const min = Math.min(targetNum, targetNum2);
          const max = Math.max(targetNum, targetNum2);
          return cellNum >= min && cellNum <= max;
        }
        if (targetNum !== null) return cellNum >= targetNum;
        if (targetNum2 !== null) return cellNum <= targetNum2;
        return true;
      default:
        return true;
    }
  }

  // 3. Date / Datetime Types
  if (meta.type === "date" || meta.type === "datetime") {
    const cellTime = parseDateTimestamp(rawValue);
    const targetTime = parseDateTimestamp(rule.value);
    const targetTime2 = parseDateTimestamp(rule.value2);

    if (cellTime === null) return false;

    // Normalize target dates to day boundaries for exact date check if type is 'date'
    if (op === "is") {
      if (!rule.value) return true;
      const cellDateStr = new Date(cellTime).toISOString().slice(0, 10);
      const targetDateStr = String(rule.value).slice(0, 10);
      return cellDateStr === targetDateStr;
    }

    switch (op) {
      case "before":
        return targetTime !== null && cellTime < targetTime;
      case "after":
        return targetTime !== null && cellTime > targetTime;
      case "between":
        if (targetTime !== null && targetTime2 !== null) {
          const start = Math.min(targetTime, targetTime2);
          // Include the full day of end
          const end = Math.max(targetTime, targetTime2) + 86400000;
          return cellTime >= start && cellTime <= end;
        }
        if (targetTime !== null) return cellTime >= targetTime;
        if (targetTime2 !== null) return cellTime <= targetTime2 + 86400000;
        return true;
      default:
        return true;
    }
  }

  // 4. Checkbox / Boolean
  if (meta.type === "checkbox") {
    const cellBool = Boolean(rawValue);
    const targetBool = rule.value === "true" || rule.value === "yes" || rule.value === "1";
    return cellBool === targetBool;
  }

  // 5. Select / Radio
  if (meta.type === "select" || meta.type === "radio") {
    const cellStr = String(rawValue ?? "").toLowerCase().trim();
    if (!filterVal) return true;
    if (op === "is") {
      return cellStr === filterVal;
    }
    if (op === "is_not") {
      return cellStr !== filterVal;
    }
  }

  // 6. Multi-Select
  if (meta.type === "multi_select") {
    const cellArr: string[] = Array.isArray(rawValue)
      ? rawValue.map((v) => String(v).toLowerCase().trim())
      : rawValue ? [String(rawValue).toLowerCase().trim()] : [];

    const targetArr: string[] = Array.isArray(rule.values) && rule.values.length > 0
      ? rule.values.map((v) => String(v).toLowerCase().trim())
      : filterVal ? [filterVal] : [];

    if (targetArr.length === 0) return true;

    switch (op) {
      case "contains_any":
        return targetArr.some((t) => cellArr.includes(t));
      case "contains_all":
        return targetArr.every((t) => cellArr.includes(t));
      case "does_not_contain":
        return !targetArr.some((t) => cellArr.includes(t));
      default:
        return true;
    }
  }

  // 7. General Text / String Matching (Email, Phone, URL, Text)
  const cellText = String(rawValue ?? "").toLowerCase().trim();

  if (!filterVal) {
    return true;
  }

  switch (op) {
    case "contains":
      return cellText.includes(filterVal);
    case "not_contains":
      return !cellText.includes(filterVal);
    case "equals":
    case "is":
      return cellText === filterVal;
    case "not_equals":
    case "is_not":
      return cellText !== filterVal;
    case "starts_with":
      return cellText.startsWith(filterVal);
    case "ends_with":
      return cellText.endsWith(filterVal);
    default:
      return cellText.includes(filterVal);
  }
}

/* ─── Engine: Apply All Filter Rules (AND Logic) ─── */

export function applyDynamicFilters(
  leads: Lead[],
  rules: DynamicFilterRule[],
  customFields: CustomFieldDef[],
  leadCustomValues: Record<string, Record<string, unknown>>,
  visibleColumns: ColumnId[],
): Lead[] {
  // Only evaluate rules for columns that are CURRENTLY VISIBLE
  const activeVisibleRules = rules.filter((r) => visibleColumns.includes(r.columnId));

  if (activeVisibleRules.length === 0) {
    return leads;
  }

  return leads.filter((lead) => {
    return activeVisibleRules.every((rule) =>
      evaluateFilterRule(lead, rule, customFields, leadCustomValues),
    );
  });
}

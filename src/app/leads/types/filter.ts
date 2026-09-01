export type StandardColumnId =
  | "name"
  | "email"
  | "phone"
  | "interest"
  | "budget"
  | "temperature"
  | "score"
  | "status"
  | "verification_grade"
  | "source"
  | "channel"
  | "follow_up_sent"
  | "created_at"
  | "updated_at"
  | "actions";

export type ColumnId = StandardColumnId | string;

export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "multi_select"
  | "radio"
  | "date"
  | "datetime"
  | "url"
  | "email"
  | "phone"
  | "currency";

export interface CustomFieldOption {
  id: string;
  label: string;
  color?: string;
}

export interface CustomFieldDef {
  id: string;
  name: string;
  key: string;
  type: CustomFieldType;
  color: string;
  options?: CustomFieldOption[];
  defaultValue?: string | number | boolean | string[];
  currencySymbol?: string;
  minWidth: number;
  createdAt: string;
}

export type FilterFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "currency"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "date"
  | "datetime"
  | "url";

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "between"
  | "before"
  | "after"
  | "is"
  | "is_not"
  | "contains_any"
  | "contains_all"
  | "does_not_contain"
  | "is_empty"
  | "is_not_empty";

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  /** Native tooltip for merchant education (e.g. verification grades). */
  title?: string;
}

export interface FilterColumnMetadata {
  id: ColumnId;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  currencySymbol?: string;
  isCustom?: boolean;
  customDef?: CustomFieldDef;
}

export interface DynamicFilterRule {
  id: string;
  columnId: ColumnId;
  operator: FilterOperator;
  value: string;
  value2?: string; // For "between" ranges
  values?: string[]; // For multi-select
}

export interface OperatorDefinition {
  label: string;
  operator: FilterOperator;
  requiresValue?: boolean;
  requiresDualValue?: boolean; // For "between" (min/max or from/to)
  requiresMultiValue?: boolean; // For multi-select
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  Filter,
  Hash,
  Layers,
  ListFilter,
  Mail,
  Phone,
  Plus,
  Radio,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type {
  ColumnId,
  CustomFieldDef,
  DynamicFilterRule,
  FilterColumnMetadata,
  FilterFieldType,
  FilterOperator,
} from "../types/filter";
import {
  getColumnMetadata,
  getDefaultOperator,
  OPERATORS_BY_TYPE,
} from "../utils/filterEngine";
import styles from "../leads.module.css";

interface DynamicFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: ColumnId[];
  customFields: CustomFieldDef[];
  appliedRules: DynamicFilterRule[];
  onApplyRules: (rules: DynamicFilterRule[]) => void;
}

export function DynamicFilterPopover({
  isOpen,
  onClose,
  visibleColumns,
  customFields,
  appliedRules,
  onApplyRules,
}: DynamicFilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Local draft state for filters before applying
  const [draftRules, setDraftRules] = useState<DynamicFilterRule[]>(appliedRules);
  const [columnSearch, setColumnSearch] = useState("");

  // Sync draft state whenever popover opens or appliedRules change from outside
  useEffect(() => {
    if (isOpen) {
      setDraftRules(appliedRules);
      setColumnSearch("");
    }
  }, [isOpen, appliedRules]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ─── Available Filterable Columns (Strictly from Visible Columns) ───
  const filterableColumns: FilterColumnMetadata[] = useMemo(() => {
    return visibleColumns
      .map((id) => getColumnMetadata(id, customFields))
      .filter((meta): meta is FilterColumnMetadata => meta !== null);
  }, [visibleColumns, customFields]);

  // Filter column choices if search query entered
  const filteredColumnChoices = useMemo(() => {
    if (!columnSearch.trim()) return filterableColumns;
    const q = columnSearch.toLowerCase().trim();
    return filterableColumns.filter((c) => c.label.toLowerCase().includes(q));
  }, [filterableColumns, columnSearch]);

  // ─── Filter Rule Handlers ───

  function handleAddFilter(columnId?: ColumnId) {
    const targetCol = columnId
      ? filterableColumns.find((c) => c.id === columnId)
      : filterableColumns[0];

    if (!targetCol) return;

    const defaultOp = getDefaultOperator(targetCol.type);
    const newRule: DynamicFilterRule = {
      id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      columnId: targetCol.id,
      operator: defaultOp,
      value: targetCol.type === "checkbox" ? "true" : "",
    };

    setDraftRules((prev) => [...prev, newRule]);
    setColumnSearch("");
  }

  function handleUpdateColumn(ruleId: string, newColId: ColumnId) {
    const targetCol = filterableColumns.find((c) => c.id === newColId);
    if (!targetCol) return;

    const defaultOp = getDefaultOperator(targetCol.type);
    setDraftRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          columnId: newColId,
          operator: defaultOp,
          value: targetCol.type === "checkbox" ? "true" : "",
          value2: undefined,
          values: undefined,
        };
      }),
    );
  }

  function handleUpdateOperator(ruleId: string, newOp: FilterOperator) {
    setDraftRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          operator: newOp,
        };
      }),
    );
  }

  function handleUpdateValue(ruleId: string, val: string) {
    setDraftRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, value: val } : r)),
    );
  }

  function handleUpdateValue2(ruleId: string, val2: string) {
    setDraftRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, value2: val2 } : r)),
    );
  }

  function handleToggleMultiSelectValue(ruleId: string, optionVal: string) {
    setDraftRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const current = r.values || [];
        const next = current.includes(optionVal)
          ? current.filter((v) => v !== optionVal)
          : [...current, optionVal];
        return { ...r, values: next, value: next.join(",") };
      }),
    );
  }

  function handleRemoveRule(ruleId: string) {
    setDraftRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  function handleClearAll() {
    setDraftRules([]);
    onApplyRules([]);
  }

  function handleApply() {
    // Filter out rules where column is no longer visible
    const validRules = draftRules.filter((r) =>
      visibleColumns.includes(r.columnId),
    );
    onApplyRules(validRules);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className={styles.dynamicFilterOverlay}>
      <div ref={popoverRef} className={styles.dynamicFilterPopover}>
        {/* ─── Popover Header ─── */}
        <div className={styles.filterPopoverHeader}>
          <div className="flex items-center gap-2">
            <span className={styles.filterPopoverTitle}>Filter Leads</span>
            {draftRules.length > 0 && (
              <span className={styles.filterPopoverBadge}>{draftRules.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draftRules.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className={styles.filterPopoverClearBtn}
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              className={styles.filterPopoverCloseBtn}
              onClick={onClose}
              aria-label="Close filters"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ─── Filter Rows Body ─── */}
        <div className={styles.filterPopoverBody}>
          {filterableColumns.length === 0 ? (
            <div className={styles.filterEmptyNotice}>
              No visible filterable columns. Customize columns to show table fields.
            </div>
          ) : draftRules.length === 0 ? (
            <div className={styles.filterEmptyState}>
              <p className="text-xs text-muted-foreground mb-3">
                No active column filters. Add a filter to narrow down your leads.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center max-w-[480px]">
                {filterableColumns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    className={styles.quickAddFilterChip}
                    onClick={() => handleAddFilter(col.id)}
                  >
                    {col.isCustom && col.customDef ? (
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: col.customDef.color || "var(--primary)" }}
                      />
                    ) : null}
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.filterRulesList}>
              {draftRules.map((rule, idx) => {
                const meta = getColumnMetadata(rule.columnId, customFields);
                if (!meta) return null;

                const operators = OPERATORS_BY_TYPE[meta.type] || OPERATORS_BY_TYPE.text;
                const currentOpDef = operators.find((o) => o.operator === rule.operator);
                const requiresVal = currentOpDef?.requiresValue ?? true;
                const requiresDual = currentOpDef?.requiresDualValue ?? false;
                const requiresMulti = currentOpDef?.requiresMultiValue ?? false;

                const standardCols = filterableColumns.filter((c) => !c.isCustom);
                const customCols = filterableColumns.filter((c) => c.isCustom);

                return (
                  <div key={rule.id} className={styles.filterRuleRow}>
                    {/* Row connector index or label */}
                    <div className={styles.ruleConnector}>
                      {idx === 0 ? (
                        <span className={styles.whereBadge}>Where</span>
                      ) : (
                        <span className={styles.andBadge}>AND</span>
                      )}
                    </div>

                    {/* Column Select */}
                    <div className={styles.ruleColSelectWrap}>
                      <Select
                        size="sm"
                        value={rule.columnId}
                        onChange={(val) => handleUpdateColumn(rule.id, val as ColumnId)}
                        options={[
                          ...standardCols.map((col) => ({
                            value: col.id,
                            label: col.label,
                            group: "Standard Columns",
                          })),
                          ...customCols.map((col) => ({
                            value: col.id,
                            label: `✦ ${col.label}`,
                            group: "Custom Fields",
                          })),
                        ]}
                      />
                    </div>

                    {/* Operator Select */}
                    <div className={styles.ruleOpSelectWrap}>
                      <Select
                        size="sm"
                        value={rule.operator}
                        onChange={(val) =>
                          handleUpdateOperator(rule.id, val as FilterOperator)
                        }
                        options={operators.map((op) => ({
                          value: op.operator,
                          label: op.label,
                        }))}
                      />
                    </div>

                    {/* Dynamic Value Input */}
                    <div className={styles.ruleValueWrap}>
                      {!requiresVal && !requiresDual && !requiresMulti ? (
                        <span className={styles.ruleNoValuePlaceholder}>
                          (no value required)
                        </span>
                      ) : requiresDual ? (
                        /* Dual inputs for "between" ranges */
                        <div className={styles.dualInputRow}>
                          <input
                            type={meta.type === "date" ? "date" : meta.type === "datetime" ? "datetime-local" : "number"}
                            placeholder="Min / From"
                            value={rule.value || ""}
                            onChange={(e) => handleUpdateValue(rule.id, e.target.value)}
                            className={styles.ruleInput}
                          />
                          <span className="text-xs text-muted-foreground font-semibold">to</span>
                          <input
                            type={meta.type === "date" ? "date" : meta.type === "datetime" ? "datetime-local" : "number"}
                            placeholder="Max / To"
                            value={rule.value2 || ""}
                            onChange={(e) => handleUpdateValue2(rule.id, e.target.value)}
                            className={styles.ruleInput}
                          />
                        </div>
                      ) : meta.type === "select" || meta.type === "radio" ? (
                        /* Single Select Dropdown */
                        <Select
                          size="sm"
                          value={rule.value || ""}
                          placeholder={`— Select ${meta.label} —`}
                          onChange={(val) => handleUpdateValue(rule.id, val)}
                          options={meta.options?.map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                          })) || []}
                        />
                      ) : meta.type === "checkbox" ? (
                        /* Checkbox Yes / No */
                        <Select
                          size="sm"
                          value={rule.value || "true"}
                          onChange={(val) => handleUpdateValue(rule.id, val)}
                          options={[
                            { value: "true", label: "Yes" },
                            { value: "false", label: "No" },
                          ]}
                        />
                      ) : meta.type === "multi_select" ? (
                        /* Multi-select Tags */
                        <div className={styles.multiSelectContainer}>
                          {meta.options?.map((opt) => {
                            const isSelected = (rule.values || []).includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                className={`${styles.multiSelectTag} ${
                                  isSelected ? styles.multiSelectTagActive : ""
                                }`}
                                onClick={() => handleToggleMultiSelectValue(rule.id, opt.value)}
                              >
                                {isSelected && <Check size={11} className="inline mr-1" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : meta.type === "date" ? (
                        /* Date Picker */
                        <input
                          type="date"
                          value={rule.value || ""}
                          onChange={(e) => handleUpdateValue(rule.id, e.target.value)}
                          className={styles.ruleInput}
                        />
                      ) : meta.type === "datetime" ? (
                        /* Datetime Picker */
                        <input
                          type="datetime-local"
                          value={rule.value || ""}
                          onChange={(e) => handleUpdateValue(rule.id, e.target.value)}
                          className={styles.ruleInput}
                        />
                      ) : meta.type === "number" || meta.type === "currency" ? (
                        /* Number / Currency Input */
                        <div className="flex items-center gap-1 w-full">
                          {meta.currencySymbol && (
                            <span className="text-xs text-muted-foreground font-semibold pl-1">
                              {meta.currencySymbol}
                            </span>
                          )}
                          <input
                            type="number"
                            placeholder="e.g. 50000"
                            value={rule.value || ""}
                            onChange={(e) => handleUpdateValue(rule.id, e.target.value)}
                            className={styles.ruleInput}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleApply();
                            }}
                          />
                        </div>
                      ) : (
                        /* Standard Text Input */
                        <input
                          type="text"
                          placeholder={`Filter by ${meta.label.toLowerCase()}…`}
                          value={rule.value || ""}
                          onChange={(e) => handleUpdateValue(rule.id, e.target.value)}
                          className={styles.ruleInput}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleApply();
                          }}
                        />
                      )}
                    </div>

                    {/* Delete Rule Button */}
                    <button
                      type="button"
                      className={styles.ruleDeleteBtn}
                      onClick={() => handleRemoveRule(rule.id)}
                      title="Remove filter"
                      aria-label="Remove filter rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Popover Footer ─── */}
        <div className={styles.filterPopoverFooter}>
          {filterableColumns.length > 0 && (
            <button
              type="button"
              className={styles.addFilterRowBtn}
              onClick={() => handleAddFilter()}
            >
              <span>Add filter</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

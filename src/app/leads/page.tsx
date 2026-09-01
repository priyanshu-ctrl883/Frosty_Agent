"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  CircleDollarSign,
  Globe,
  GripVertical,
  Hash,
  Layers,
  Link as LinkIcon,
  ListFilter,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  Users,
  X,
  MoreVertical,
  MoreHorizontal,
  Eye,
} from "lucide-react";

import { VerificationBadge } from "@/components/leads/VerificationBadge";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PageState, ErrorBox } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { apiRequest } from "@/lib/api";
import { dateTime, relative, titleCase } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { Agent, Lead, FollowUpSettings } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { useToast } from "@/lib/toast";
import { fetchFollowUpSettings, saveFollowUpSettings, patchLead as patchLeadApi } from "@/lib/leads/api";
import { DynamicFilterPopover } from "./components/DynamicFilterPopover";
import { OutreachTab } from "./components/OutreachTab";
import { LeadsChannelAgentFilter, type LeadsChannelFilter } from "./components/LeadsChannelAgentFilter";
import { OutreachDrawer } from "./components/OutreachDrawer";
import { WhatsAppTemplateModal } from "./components/WhatsAppTemplateModal";
import { FollowUpSettingsPanel } from "@/components/leads/FollowUpSettingsPanel";
import type { DynamicFilterRule } from "./types/filter";
import { applyDynamicFilters, getColumnMetadata } from "./utils/filterEngine";
import { TableDateFilter, type TableDatePreset, formatDateIso } from "@/components/ui/TableDateFilter";
import styles from "./leads.module.css";

/* ─── Column Types & Systematic Definitions ─── */

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
  | "outreach_action"
  | "chat_action"
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

interface ColumnDef {
  id: ColumnId;
  label: string;
  minWidth: number;
  sortable: boolean;
  canHide: boolean;
  isCustom?: boolean;
  customDef?: CustomFieldDef;
}

const STANDARD_COLUMNS: ColumnDef[] = [
  { id: "name", label: "Lead", minWidth: 200, sortable: true, canHide: false },
  { id: "email", label: "Email", minWidth: 180, sortable: true, canHide: true },
  { id: "phone", label: "Phone", minWidth: 140, sortable: true, canHide: true },
  { id: "interest", label: "Interest", minWidth: 200, sortable: true, canHide: true },
  { id: "budget", label: "Budget", minWidth: 120, sortable: true, canHide: true },
  { id: "temperature", label: "Temp", minWidth: 100, sortable: true, canHide: true },
  { id: "score", label: "Score", minWidth: 90, sortable: true, canHide: true },
  { id: "status", label: "Status", minWidth: 135, sortable: true, canHide: true },
  { id: "verification_grade", label: "Verify", minWidth: 130, sortable: true, canHide: true },
  { id: "source", label: "Source", minWidth: 110, sortable: true, canHide: true },
  { id: "channel", label: "Channel", minWidth: 120, sortable: true, canHide: true },
  { id: "created_at", label: "Created At", minWidth: 145, sortable: true, canHide: true },
  { id: "updated_at", label: "Updated At", minWidth: 135, sortable: true, canHide: true },
  { id: "actions", label: "Actions", minWidth: 64, sortable: false, canHide: false },
];

const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [
  "name",
  "interest",
  "channel",
  "temperature",
  "score",
  "status",
  "verification_grade",
  "actions",
];

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#3b82f6",
  "#14b8a6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#ec4899",
  "#64748b",
];

const FIELD_TYPE_CONFIG: Record<
  CustomFieldType,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  text: { label: "Text", icon: Type },
  textarea: { label: "Textarea", icon: AlignLeft },
  number: { label: "Number", icon: Hash },
  checkbox: { label: "Checkbox", icon: CheckSquare },
  select: { label: "Select", icon: ListFilter },
  multi_select: { label: "Multi-select", icon: Layers },
  radio: { label: "Radio", icon: Radio },
  date: { label: "Date", icon: Calendar },
  datetime: { label: "Date & Time", icon: CalendarClock },
  url: { label: "URL", icon: LinkIcon },
  email: { label: "Email", icon: Mail },
  phone: { label: "Phone", icon: Phone },
  currency: { label: "Currency", icon: CircleDollarSign },
};

type TempFilter = "all" | "hot" | "warm" | "cold";
type StatusFilter = "all" | "new" | "contacted" | "qualified" | "converted" | "lost";

const STATUSES: Lead["status"][] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

/* ─── Draggable / Sortable Table Header Cell Component ─── */

interface SortableHeaderCellProps {
  column: ColumnDef;
  sortColumn: ColumnId | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (colId: ColumnId) => void;
}

function SortableHeaderCell({
  column,
  sortColumn,
  sortDirection,
  onSort,
}: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    minWidth: `${column.minWidth}px`,
    width: `${column.minWidth}px`,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : 1,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
  };

  const isSorted = sortColumn === column.id;

  return (
    <th ref={setNodeRef} style={style} className={styles.th}>
      <div className={`${styles.thHeaderContent} ${column.id === "actions" ? "justify-end" : ""}`}>
        {/* Subtle Grip Handle */}
        {column.id !== "actions" && (
          <span
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            title="Drag to reorder column"
            aria-label={`Reorder ${column.label} column`}
          >
            <GripVertical size={13} />
          </span>
        )}

        {/* Sortable Header Button */}
        {column.sortable ? (
          <button
            type="button"
            className={styles.sortButton}
            onClick={() => onSort(column.id)}
            title={
              column.id === "verification_grade"
                ? "Verification grade (best wins): unverified → format valid → channel verified → email verified → reachable. Hover a badge for what each means."
                : `Sort by ${column.label}`
            }
          >
            {column.isCustom && column.customDef && (
              <span
                className={styles.colorDot}
                style={{ backgroundColor: column.customDef.color }}
              />
            )}
            <span className="truncate">{column.label}</span>
            {isSorted ? (
              sortDirection === "asc" ? (
                <ArrowUp size={12} className={styles.sortIconActive} />
              ) : (
                <ArrowDown size={12} className={styles.sortIconActive} />
              )
            ) : (
              <ArrowUpDown size={11} className={styles.sortIconInactive} />
            )}
          </button>
        ) : (
          <span className={`font-bold flex items-center gap-1.5 truncate ${column.id === "actions" ? "text-right" : "flex-1"}`}>
            {column.isCustom && column.customDef && (
              <span
                className={styles.colorDot}
                style={{ backgroundColor: column.customDef.color }}
              />
            )}
            <span className="truncate">{column.label}</span>
          </span>
        )}
      </div>
    </th>
  );
}

/* ─── CSV Cell Formula Injection Protection ─── */
function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/* ─── Main Leads Page Component ─── */

export default function LeadsPage() {
  const { me } = useWorkspace();
  const canWrite = can(me?.permissions, "leads:write");
  const { success: toastSuccess, error: toastError } = useToast();

  // Tab State: Overview vs Outreach
  const [activeTab, setActiveTab] = useState<"overview" | "outreach">("overview");

  // Shared Outreach Drawer & WhatsApp Modal States
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null);
  const [isOutreachDrawerOpen, setIsOutreachDrawerOpen] = useState(false);
  const [templateModalLead, setTemplateModalLead] = useState<Lead | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [showFollowUpSettings, setShowFollowUpSettings] = useState(false);
  const [followUpSettings, setFollowUpSettings] = useState<FollowUpSettings | null>(null);

  // Server Data & API Filters (Supported by existing API)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [temp, setTemp] = useState<TempFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [leadsChannelFilter, setLeadsChannelFilter] = useState<LeadsChannelFilter>("all");
  const [leadsAgentScope, setLeadsAgentScope] = useState<string>("all");
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extended Dynamic Filter Rules (Driven by Visible Columns)
  const [query, setQuery] = useState("");
  const [filterRules, setFilterRules] = useState<DynamicFilterRule[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverAnchorRef = useRef<HTMLDivElement>(null);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<TableDatePreset>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Sorting State
  const [sortColumn, setSortColumn] = useState<ColumnId | null>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Custom Fields State
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [leadCustomValues, setLeadCustomValues] = useState<Record<string, Record<string, unknown>>>({});

  // Column Configuration & Visibility
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(STANDARD_COLUMNS.map((c) => c.id));
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showColSelector, setShowColSelector] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Custom Field Modal State (Create & Edit)
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [editingCustomFieldId, setEditingCustomFieldId] = useState<string | null>(null);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldType, setCustomFieldType] = useState<CustomFieldType>("text");
  const [customFieldColor, setCustomFieldColor] = useState<string>(PRESET_COLORS[0] || "#6366f1");
  const [customFieldCurrency, setCustomFieldCurrency] = useState("$");
  const [customFieldOptions, setCustomFieldOptions] = useState<CustomFieldOption[]>([
    { id: "opt_1", label: "Option 1", color: "#3b82f6" },
    { id: "opt_2", label: "Option 2", color: "#10b981" },
  ]);
  const [customFieldError, setCustomFieldError] = useState<string | null>(null);

  // New Lead Modal / Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    budget: "",
    temperature: "warm" as Lead["temperature"],
  });

  // Setup dnd-kit sensors with pointer activation constraints (prevent accidental drag on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ─── Preference & Custom Field Persistence ─── */
  const storageKey = me?.user_id
    ? `frosty_leads_table_prefs_${me.active_merchant_id || "m"}_${me.user_id}`
    : null;

  const customFieldsStorageKey = me?.user_id
    ? `frosty_leads_custom_fields_${me.active_merchant_id || "m"}_${me.user_id}`
    : null;

  const [actionDropdownOpenId, setActionDropdownOpenId] = useState<number | null>(null);

  const customValuesStorageKey = me?.user_id
    ? `frosty_leads_custom_values_${me.active_merchant_id || "m"}_${me.user_id}`
    : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.visibleColumns) && parsed.visibleColumns.length > 0) {
          let cols: ColumnId[] = [...parsed.visibleColumns];
          // Migrate legacy separate action/chat columns to single unified actions column
          if (cols.includes("outreach_action") || cols.includes("chat_action")) {
            cols = cols.filter((c) => c !== "outreach_action" && c !== "chat_action");
          }
          if (!cols.includes("actions")) cols.push("actions");
          if (!cols.includes("channel")) cols.splice(2, 0, "channel");
          cols = cols.filter((c) => c !== "follow_up_sent");

          setVisibleColumns(cols);
        }
        if (Array.isArray(parsed.columnOrder) && parsed.columnOrder.length > 0) {
          let order: ColumnId[] = [...parsed.columnOrder].filter((c) => c !== "follow_up_sent");
          if (order.includes("outreach_action") || order.includes("chat_action")) {
            const idx = Math.min(
              order.includes("outreach_action") ? order.indexOf("outreach_action") : 999,
              order.includes("chat_action") ? order.indexOf("chat_action") : 999
            );
            order = order.filter((c) => c !== "outreach_action" && c !== "chat_action");
            order.splice(idx, 0, "actions");
          }
          if (!order.includes("actions")) {
            order.push("actions");
          }
          for (const col of STANDARD_COLUMNS) {
            if (!order.includes(col.id)) {
              order.push(col.id);
            }
          }
          setColumnOrder(order);
        }
        if (parsed.pageSize) {
          setPageSize(parsed.pageSize);
        }
      }
    } catch {
      // Gracefully ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (!customFieldsStorageKey) return;
    try {
      const savedFields = localStorage.getItem(customFieldsStorageKey);
      if (savedFields) {
        const parsedFields: CustomFieldDef[] = JSON.parse(savedFields);
        if (Array.isArray(parsedFields)) {
          setCustomFields(parsedFields);
        }
      }
    } catch {
      // Ignore
    }
  }, [customFieldsStorageKey]);

  useEffect(() => {
    if (!customValuesStorageKey) return;
    try {
      const savedValues = localStorage.getItem(customValuesStorageKey);
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        if (parsedValues && typeof parsedValues === "object") {
          setLeadCustomValues(parsedValues);
        }
      }
    } catch {
      // Ignore
    }
  }, [customValuesStorageKey]);

  const savePreferences = useCallback(
    (newVisible: ColumnId[], newOrder: ColumnId[], newPageSize?: number) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            visibleColumns: newVisible,
            columnOrder: newOrder,
            pageSize: newPageSize ?? pageSize,
          }),
        );
      } catch {
        // Ignore
      }
    },
    [storageKey, pageSize],
  );

  const saveCustomFields = useCallback(
    (newFields: CustomFieldDef[]) => {
      if (!customFieldsStorageKey) return;
      try {
        localStorage.setItem(customFieldsStorageKey, JSON.stringify(newFields));
      } catch {
        // Ignore
      }
    },
    [customFieldsStorageKey],
  );

  const updateLeadCustomValue = useCallback(
    (leadId: number, fieldKey: string, value: unknown) => {
      setLeadCustomValues((prev) => {
        const next = {
          ...prev,
          [String(leadId)]: {
            ...(prev[String(leadId)] || {}),
            [fieldKey]: value,
          },
        };
        if (customValuesStorageKey) {
          try {
            localStorage.setItem(customValuesStorageKey, JSON.stringify(next));
          } catch {
            // Ignore
          }
        }
        return next;
      });
    },
    [customValuesStorageKey],
  );

  /* ─── Outreach Handlers ─── */
  const handleOpenOutreach = useCallback((lead: Lead) => {
    const isWaLead = lead.channel === "whatsapp" || (!lead.email && Boolean(lead.phone));
    const lastActive = lead.updated_at ? new Date(lead.updated_at) : new Date(lead.created_at);
    const isWaOutside24h = isWaLead && Date.now() - lastActive.getTime() > 24 * 60 * 60 * 1000;

    if (isWaOutside24h) {
      setTemplateModalLead(lead);
      setIsTemplateModalOpen(true);
      return;
    }

    setOutreachLead(lead);
    setIsOutreachDrawerOpen(true);
  }, []);

  const handleOpenWhatsAppTemplate = useCallback((lead: Lead) => {
    setTemplateModalLead(lead);
    setIsTemplateModalOpen(true);
  }, []);

  const handleUpdateLeadStatus = useCallback(async (leadId: number, nextStatus: string) => {
    try {
      await patchLeadApi(leadId, { status: nextStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus, updated_at: new Date().toISOString() } : l))
      );
      toastSuccess("Lead status updated.");
    } catch (err: any) {
      toastError(err?.message || "Failed to update status");
    }
  }, [toastSuccess, toastError]);

  const handleOpenFollowUpSettings = useCallback(async () => {
    try {
      const settings = await fetchFollowUpSettings();
      setFollowUpSettings(settings);
    } catch {
      // ignore
    }
    setShowFollowUpSettings(true);
  }, []);

  const handleSaveFollowUpSettings = useCallback(async (body: Partial<FollowUpSettings>) => {
    const updated = await saveFollowUpSettings(body);
    setFollowUpSettings(updated);
    toastSuccess("Follow-up settings saved.");
  }, [toastSuccess]);

  /* ─── Combined Column Registry ─── */
  const allAvailableColumns: ColumnDef[] = useMemo(() => {
    const customColDefs: ColumnDef[] = customFields.map((cf) => ({
      id: cf.id,
      label: cf.name,
      minWidth: cf.minWidth || 160,
      sortable: true,
      canHide: true,
      isCustom: true,
      customDef: cf,
    }));
    return [...STANDARD_COLUMNS, ...customColDefs];
  }, [customFields]);

  const handleLeadsChannelChange = (next: LeadsChannelFilter) => {
    setLeadsChannelFilter(next);
    setLeadsAgentScope("all");
  };

  useEffect(() => {
    apiRequest<Agent[]>("/v1/agents")
      .then((list) => setAgentsList(list || []))
      .catch(() => setAgentsList([]));
  }, []);

  /* ─── Close Column Selector on Click Outside ─── */
  useEffect(() => { 
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowColSelector(false);
      }
    }
    if (showColSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColSelector]);

  /* ─── Load Leads from Real API ─── */
  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (temp !== "all") params.set("temperature", temp);
      if (status !== "all") params.set("status", status);
      if (leadsChannelFilter !== "all") params.set("channel", leadsChannelFilter);
      if (leadsAgentScope !== "all") params.set("agent_id", leadsAgentScope);
      const data = await apiRequest<Lead[]>(`/v1/leads?${params}`);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [status, temp, leadsChannelFilter, leadsAgentScope]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, temp, status, leadsChannelFilter, leadsAgentScope, filterRules, pageSize, datePreset, fromDate, toDate]);

  // Synchronize dynamic filter rules: automatically purge any filter rule whose column is hidden
  useEffect(() => {
    setFilterRules((prev) => prev.filter((r) => visibleColumns.includes(r.columnId)));
  }, [visibleColumns]);

  /* ─── Filter & Search Logic ─── */
  const filtered = useMemo(() => {
    let result = leads;

    // 1. Global Search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((l) => {
        const standardMatches = [
          l.name,
          l.email,
          l.phone,
          l.interest,
          l.budget,
          l.source,
          l.channel,
          l.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

        const customVals = leadCustomValues[String(l.id)] || {};
        const customMatches = Object.values(customVals)
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

        return standardMatches || customMatches;
      });
    }

    // 2. Date Range Filter
    const isDateActive = datePreset !== "all" || Boolean(fromDate) || Boolean(toDate);
    if (isDateActive) {
      result = result.filter((l) => {
        if (!l.created_at) return false;
        const leadDate = new Date(l.created_at);
        if (isNaN(leadDate.getTime())) return false;
        const now = new Date();
        const leadDateIso = formatDateIso(leadDate);
        const todayIsoStr = formatDateIso(now);

        if (datePreset === "today") {
          if (leadDateIso !== todayIsoStr) return false;
        } else if (datePreset === "yesterday") {
          const y = new Date();
          y.setDate(now.getDate() - 1);
          if (leadDateIso !== formatDateIso(y)) return false;
        } else if (datePreset === "week") {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === "14d") {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 14 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === "month") {
          const diff = now.getTime() - leadDate.getTime();
          if (diff < 0 || diff > 30 * 24 * 60 * 60 * 1000) return false;
        } else if (datePreset === "this_month") {
          if (leadDate.getFullYear() !== now.getFullYear() || leadDate.getMonth() !== now.getMonth()) return false;
        } else if (datePreset === "last_month") {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          if (leadDate < firstDayLastMonth || leadDate > lastDayLastMonth) return false;
        } else if (datePreset === "custom" || fromDate || toDate) {
          if (fromDate) {
            const f = new Date(fromDate + "T00:00:00");
            if (leadDate < f) return false;
          }
          if (toDate) {
            const t = new Date(toDate + "T23:59:59.999");
            if (leadDate > t) return false;
          }
        }
        return true;
      });
    }

    // 3. Dynamic Column Filters (AND logic across all active rules on visible columns)
    result = applyDynamicFilters(
      result,
      filterRules,
      customFields,
      leadCustomValues,
      visibleColumns,
    );

    return result;
  }, [leads, query, filterRules, customFields, leadCustomValues, visibleColumns, datePreset, fromDate, toDate]);

  /* ─── Sort Logic ─── */
  const sorted = useMemo(() => {
    if (!sortColumn || !sortDirection) return filtered;

    const isCustomCol = sortColumn.startsWith("custom_");
    const customColDef = isCustomCol ? customFields.find((cf) => cf.id === sortColumn) : null;

    return [...filtered].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (isCustomCol && customColDef) {
        const aCustom = (leadCustomValues[String(a.id)] || {})[customColDef.key];
        const bCustom = (leadCustomValues[String(b.id)] || {})[customColDef.key];
        aVal = aCustom !== undefined && aCustom !== null ? String(aCustom).toLowerCase() : "";
        bVal = bCustom !== undefined && bCustom !== null ? String(bCustom).toLowerCase() : "";
      } else if (sortColumn === "score") {
        aVal = a.score ?? 0;
        bVal = b.score ?? 0;
      } else if (sortColumn === "created_at" || sortColumn === "updated_at") {
        aVal = new Date(String(a[sortColumn as keyof Lead] || 0)).getTime();
        bVal = new Date(String(b[sortColumn as keyof Lead] || 0)).getTime();
      } else {
        aVal = String(a[sortColumn as keyof Lead] ?? "").toLowerCase();
        bVal = String(b[sortColumn as keyof Lead] ?? "").toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortColumn, sortDirection, customFields, leadCustomValues]);

  /* ─── Pagination Math ─── */
  const totalLeads = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLeads);
  const paginatedLeads = useMemo(() => {
    return sorted.slice(startIndex, endIndex);
  }, [sorted, startIndex, endIndex]);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (clampedPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (clampedPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", clampedPage - 1, clampedPage, clampedPage + 1, "...", totalPages];
  };

  /* ─── Temperature & Channel Counts (from raw dataset) ─── */
  const counts = useMemo(() => {
    return {
      hot: leads.filter((l) => l.temperature === "hot").length,
      warm: leads.filter((l) => l.temperature === "warm").length,
      cold: leads.filter((l) => l.temperature === "cold").length,
      website: leads.filter((l) => (l.channel || "website") === "website").length,
      whatsapp: leads.filter((l) => l.channel === "whatsapp").length,
    };
  }, [leads]);

  /* ─── Sorting Handler ─── */
  function handleSort(colId: ColumnId) {
    if (sortColumn === colId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  }

  /* ─── Drag & Drop Column Reorder Handler ─── */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as ColumnId);
      const newIndex = columnOrder.indexOf(over.id as ColumnId);
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);
      savePreferences(visibleColumns, newOrder);
    }
  }

  /* ─── Column Visibility Toggles ─── */
  function toggleColumnVisibility(colId: ColumnId) {
    const isVisible = visibleColumns.includes(colId);
    let nextVisible: ColumnId[];
    if (isVisible) {
      if (visibleColumns.length <= 1) return;
      nextVisible = visibleColumns.filter((id) => id !== colId);
    } else {
      nextVisible = [...visibleColumns, colId];
    }
    setVisibleColumns(nextVisible);
    savePreferences(nextVisible, columnOrder);
  }

  function resetToDefaultColumns() {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    const standardOrder = STANDARD_COLUMNS.map((c) => c.id);
    setColumnOrder(standardOrder);
    savePreferences(DEFAULT_VISIBLE_COLUMNS, standardOrder);
  }

  const activeOrderedColumns = useMemo(() => {
    const colMap = new Map(allAvailableColumns.map((c) => [c.id, c]));
    const ordered = columnOrder
      .filter((id) => visibleColumns.includes(id))
      .map((id) => colMap.get(id)!)
      .filter(Boolean);

    // Ensure any visible column not yet in columnOrder is appended
    const existingIds = new Set(ordered.map((c) => c.id));
    for (const id of visibleColumns) {
      if (!existingIds.has(id) && colMap.has(id)) {
        ordered.push(colMap.get(id)!);
      }
    }
    return ordered;
  }, [columnOrder, visibleColumns, allAvailableColumns]);

  /* ─── Active Filter Count & Clear ─── */
  const visibleActiveRules = useMemo(() => {
    return filterRules.filter((r) => visibleColumns.includes(r.columnId));
  }, [filterRules, visibleColumns]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (leadsChannelFilter !== "all") count++;
    if (leadsAgentScope !== "all") count++;
    if (temp !== "all") count++;
    if (status !== "all") count++;
    if (query.trim()) count++;
    count += visibleActiveRules.length;
    return count;
  }, [leadsChannelFilter, leadsAgentScope, temp, status, query, visibleActiveRules]);

  function clearAllFilters() {
    setQuery("");
    setTemp("all");
    setStatus("all");
    setLeadsChannelFilter("all");
    setLeadsAgentScope("all");
    setFilterRules([]);
  }

  function removeFilterRule(ruleId: string) {
    setFilterRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  function formatRuleChipLabel(rule: DynamicFilterRule): string {
    const meta = getColumnMetadata(rule.columnId, customFields);
    if (!meta) return `Filter: ${rule.value || ""}`;

    const label = meta.label;
    switch (rule.operator) {
      case "is_empty":
        return `${label}: is empty`;
      case "is_not_empty":
        return `${label}: is not empty`;
      case "between":
        return `${label}: ${rule.value || "0"} – ${rule.value2 || "∞"}`;
      case "greater_than":
        return `${label} > ${rule.value}`;
      case "greater_than_or_equal":
        return `${label} ≥ ${rule.value}`;
      case "less_than":
        return `${label} < ${rule.value}`;
      case "less_than_or_equal":
        return `${label} ≤ ${rule.value}`;
      case "is":
      case "equals":
        return `${label}: ${rule.value}`;
      case "is_not":
      case "not_equals":
        return `${label} ≠ ${rule.value}`;
      case "contains":
        return `${label} contains "${rule.value}"`;
      case "not_contains":
        return `${label} does not contain "${rule.value}"`;
      case "starts_with":
        return `${label} starts with "${rule.value}"`;
      case "ends_with":
        return `${label} ends with "${rule.value}"`;
      case "contains_any":
        return `${label} has any of (${(rule.values || [rule.value]).join(", ")})`;
      case "contains_all":
        return `${label} has all of (${(rule.values || [rule.value]).join(", ")})`;
      case "does_not_contain":
        return `${label} excludes (${(rule.values || [rule.value]).join(", ")})`;
      default:
        return `${label} ${rule.operator} ${rule.value}`;
    }
  }

  /* ─── Create / Edit Custom Field Logic ─── */
  function handleOpenCreateCustomField() {
    setShowColSelector(false);
    setEditingCustomFieldId(null);
    setCustomFieldName("");
    setCustomFieldType("text");
    setCustomFieldColor(PRESET_COLORS[0] || "#6366f1");
    setCustomFieldCurrency("$");
    setCustomFieldOptions([
      { id: "opt_1", label: "Option 1", color: "#3b82f6" },
      { id: "opt_2", label: "Option 2", color: "#10b981" },
    ]);
    setCustomFieldError(null);
    setShowCustomFieldModal(true);
  }

  function handleOpenEditCustomField(cf: CustomFieldDef) {
    setShowColSelector(false);
    setEditingCustomFieldId(cf.id);
    setCustomFieldName(cf.name);
    setCustomFieldType(cf.type);
    setCustomFieldColor(cf.color || PRESET_COLORS[0] || "#6366f1");
    setCustomFieldCurrency(cf.currencySymbol || "$");
    setCustomFieldOptions(
      cf.options && cf.options.length > 0
        ? cf.options
        : [
            { id: "opt_1", label: "Option 1", color: "#3b82f6" },
            { id: "opt_2", label: "Option 2", color: "#10b981" },
          ],
    );
    setCustomFieldError(null);
    setShowCustomFieldModal(true);
  }

  function handleSaveCustomField(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = customFieldName.trim();

    if (!trimmedName) {
      setCustomFieldError("Field name cannot be empty.");
      return;
    }

    const nameExists = allAvailableColumns.some(
      (c) =>
        c.label.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingCustomFieldId,
    );
    if (nameExists) {
      setCustomFieldError(`A column with the name "${trimmedName}" already exists.`);
      return;
    }

    if (["select", "multi_select", "radio"].includes(customFieldType)) {
      const validOptions = customFieldOptions.filter((o) => o.label.trim().length > 0);
      if (validOptions.length === 0) {
        setCustomFieldError("Please add at least one valid option.");
        return;
      }
      const optionLabels = validOptions.map((o) => o.label.trim().toLowerCase());
      const hasDuplicates = new Set(optionLabels).size !== optionLabels.length;
      if (hasDuplicates) {
        setCustomFieldError("Option names must be unique.");
        return;
      }
    }

    if (editingCustomFieldId) {
      // Edit existing custom field
      const updatedFields = customFields.map((cf) => {
        if (cf.id !== editingCustomFieldId) return cf;
        return {
          ...cf,
          name: trimmedName,
          type: customFieldType,
          color: customFieldColor || "#6366f1",
          options: ["select", "multi_select", "radio"].includes(customFieldType)
            ? customFieldOptions.filter((o) => o.label.trim().length > 0)
            : undefined,
          currencySymbol: customFieldType === "currency" ? customFieldCurrency : undefined,
        };
      });

      setCustomFields(updatedFields);
      saveCustomFields(updatedFields);
      setShowCustomFieldModal(false);
      return;
    }

    // Create new custom field
    const rawKey = trimmedName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const key = rawKey.startsWith("_") ? `field${rawKey}` : rawKey;
    const fieldId = `custom_${Date.now()}_${key}`;
    const newField: CustomFieldDef = {
      id: fieldId,
      name: trimmedName,
      key,
      type: customFieldType,
      color: customFieldColor || "#6366f1",
      options: ["select", "multi_select", "radio"].includes(customFieldType)
        ? customFieldOptions.filter((o) => o.label.trim().length > 0)
        : undefined,
      currencySymbol: customFieldType === "currency" ? customFieldCurrency : undefined,
      minWidth: 160,
      createdAt: new Date().toISOString(),
    };

    const nextCustomFields = [...customFields, newField];
    setCustomFields(nextCustomFields);
    saveCustomFields(nextCustomFields);

    const nextVisible = [...visibleColumns, fieldId];
    const nextOrder = [...columnOrder, fieldId];
    setVisibleColumns(nextVisible);
    setColumnOrder(nextOrder);
    savePreferences(nextVisible, nextOrder);

    setShowCustomFieldModal(false);
  }

  function handleDeleteCustomField(fieldId: string) {
    const nextCustomFields = customFields.filter((cf) => cf.id !== fieldId);
    setCustomFields(nextCustomFields);
    saveCustomFields(nextCustomFields);

    const nextVisible = visibleColumns.filter((id) => id !== fieldId);
    const nextOrder = columnOrder.filter((id) => id !== fieldId);
    setVisibleColumns(nextVisible);
    setColumnOrder(nextOrder);
    savePreferences(nextVisible, nextOrder);

    // Automatically remove any active filters that were filtering this deleted custom field
    setFilterRules((prev) => prev.filter((r) => r.columnId !== fieldId));
  }

  /* ─── Create Lead API Call ─── */
  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest<Lead>("/v1/leads", {
        method: "POST",
        body: {
          name: form.name || null,
          email: form.email || null,
          phone: form.phone || null,
          interest: form.interest || null,
          budget: form.budget || null,
          temperature: form.temperature,
          source: "manual",
          channel: "website",
        },
      });
      setShowForm(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        interest: "",
        budget: "",
        temperature: "warm",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create lead failed");
    } finally {
      setBusy(false);
    }
  }

  /* ─── Inline Patch Lead API Call ─── */
  async function patchLead(id: number, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiRequest<Lead>(`/v1/leads/${id}`, {
        method: "PATCH",
        body,
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update lead failed");
    } finally {
      setBusy(false);
    }
  }

  /* ─── CSV Export ─── */
  function exportCsv() {
    const headers = [
      "id",
      "name",
      "email",
      "phone",
      "interest",
      "budget",
      "temperature",
      "score",
      "status",
      "source",
      "channel",
      "follow_up_sent",
      "created_at",
      ...customFields.map((cf) => cf.name),
    ];
    const rows = sorted.map((l) => {
      const customVals = leadCustomValues[String(l.id)] || {};
      return [
        l.id,
        l.name,
        l.email,
        l.phone,
        l.interest,
        l.budget,
        l.temperature,
        l.score,
        l.status,
        l.source,
        l.channel,
        l.follow_up_sent ? "Yes" : "No",
        l.created_at,
        ...customFields.map((cf) => customVals[cf.key] ?? ""),
      ]
        .map(csvCell)
        .join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frosty-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Render Cell Content based on Column Definition ─── */
  function renderCell(lead: Lead, column: ColumnDef) {
    if (column.isCustom && column.customDef) {
      const cf = column.customDef;
      const currentVal = (leadCustomValues[String(lead.id)] || {})[cf.key];

      switch (cf.type) {
        case "checkbox":
          return (
            <input
              type="checkbox"
              checked={Boolean(currentVal)}
              onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
          );

        case "select":
        case "radio":
          return (
            <Select
              size="sm"
              value={String(currentVal || "")}
              onChange={(val) => updateLeadCustomValue(lead.id, cf.key, val)}
              placeholder="— Select —"
              options={cf.options?.map((opt) => ({
                value: opt.label,
                label: opt.label,
              })) || []}
            />
          );

        case "multi_select":
          const selectedList = Array.isArray(currentVal) ? currentVal : [];
          return (
            <span className="text-xs text-foreground">
              {selectedList.length > 0 ? selectedList.join(", ") : "—"}
            </span>
          );

        case "currency":
          return (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-semibold">
                {cf.currencySymbol || "$"}
              </span>
              <input
                type="number"
                value={currentVal !== undefined && currentVal !== null ? String(currentVal) : ""}
                placeholder="0.00"
                onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.value)}
                className={styles.customCellInput}
              />
            </div>
          );

        case "date":
          return (
            <input
              type="date"
              value={String(currentVal || "")}
              onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.value)}
              className={styles.customCellInput}
            />
          );

        case "datetime":
          return (
            <input
              type="datetime-local"
              value={String(currentVal || "")}
              onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.value)}
              className={styles.customCellInput}
            />
          );

        case "number":
          return (
            <input
              type="number"
              value={currentVal !== undefined && currentVal !== null ? String(currentVal) : ""}
              placeholder="0"
              onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.value)}
              className={styles.customCellInput}
            />
          );

        default:
          return (
            <input
              type="text"
              value={String(currentVal || "")}
              placeholder="Empty"
              onChange={(e) => updateLeadCustomValue(lead.id, cf.key, e.target.value)}
              className={styles.customCellInput}
            />
          );
      }
    }

    switch (column.id) {
      case "name":
        return (
          <div>
            <Link href={`/leads/${lead.id}`} className="text-xs font-semibold text-foreground hover:underline block truncate">
              {lead.name || "Unnamed"}
            </Link>
            {(lead.email || lead.phone) && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {[lead.email, lead.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        );

      case "email":
        return <span className="text-xs text-foreground">{lead.email || "—"}</span>;

      case "phone":
        return <span className="text-xs text-foreground font-mono">{lead.phone || "—"}</span>;

      case "interest":
        return (
          <div>
            <span className="text-xs text-foreground block truncate max-w-[220px]" title={lead.interest || ""}>
              {lead.interest || "—"}
            </span>
            {lead.budget ? <p className="text-[11px] text-muted-foreground mt-0.5">Budget: {lead.budget}</p> : null}
          </div>
        );

      case "budget":
        return <span className="text-xs text-foreground">{lead.budget || "—"}</span>;

      case "temperature":
        return (
          <div className="w-24">
            <Select
              size="sm"
              value={lead.temperature}
              disabled={busy || !canWrite}
              onChange={(val) => void patchLead(lead.id, { temperature: val })}
              options={[
                {
                  value: "hot",
                  label: <span style={{ color: "#ef4444", fontWeight: 600 }}>Hot</span>,
                },
                {
                  value: "warm",
                  label: <span style={{ color: "#f59e0b", fontWeight: 600 }}>Warm</span>,
                },
                {
                  value: "cold",
                  label: <span style={{ color: "#3b82f6", fontWeight: 600 }}>Cold</span>,
                },
              ]}
            />
          </div>
        );

      case "score": {
        const s = lead.score ?? 0;
        const scoreColor =
          s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
        return (
          <span className="text-xs font-semibold" style={{ color: scoreColor }}>
            {s}
          </span>
        );
      }

      case "status":
        return (
          <div className="w-32">
            <Select
              size="sm"
              value={lead.status}
              disabled={busy || !canWrite}
              onChange={(val) => void patchLead(lead.id, { status: val })}
              options={STATUSES.map((s) => ({
                value: s,
                label: titleCase(s),
              }))}
            />
          </div>
        );

      case "verification_grade":
        return <VerificationBadge grade={lead.verification_grade} />;

      case "source":
        return <span className="text-xs text-foreground">{lead.source || "—"}</span>;

      case "channel":
        return (
          <span className="text-xs font-medium text-foreground">
            {lead.channel === "whatsapp" ? "WhatsApp" : "Website"}
          </span>
        );

      case "follow_up_sent": {
        if (lead.follow_up_sent) {
          return <span className="text-xs font-medium text-foreground">Followed Up</span>;
        }
        if (lead.status === "contacted" || lead.status === "qualified") {
          return <span className="text-xs font-medium text-foreground">Outreach Active</span>;
        }
        if (lead.status === "converted") {
          return <span className="text-xs font-medium text-foreground">Completed</span>;
        }
        if (lead.status === "lost") {
          return <span className="text-xs font-medium text-foreground">Lost</span>;
        }
        return (
          <span className="text-xs text-muted-foreground">
            {lead.channel === "whatsapp" ? "Template Pending" : "Not Started"}
          </span>
        );
      }

      case "created_at":
        return <span className="text-xs text-foreground">{dateTime(lead.created_at)}</span>;

      case "updated_at":
        return <span className="text-xs text-foreground">{relative(lead.updated_at)}</span>;

      case "actions": {
        const isWaLead = lead.channel === "whatsapp" || (!lead.email && Boolean(lead.phone));
        const chatHref = isWaLead
          ? `/whatsapp?tab=chats${lead.conversation_id ? `&c=${lead.conversation_id}` : ""}`
          : `/website?tab=chats${lead.conversation_id ? `&c=${lead.conversation_id}` : ""}`;

        return (
          <div className="relative inline-flex items-center justify-end w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() =>
                setActionDropdownOpenId(actionDropdownOpenId === lead.id ? null : lead.id)
              }
              aria-label="Lead actions"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                actionDropdownOpenId === lead.id
                  ? "bg-[#0396A6]/15 text-[#0396A6]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              <MoreVertical size={16} />
            </button>

            {actionDropdownOpenId === lead.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setActionDropdownOpenId(null)}
                />
                <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl p-1.5 shadow-2xl z-50 min-w-[170px] text-left animate-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setActionDropdownOpenId(null);
                      handleOpenOutreach(lead);
                    }}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-[#0396A6]/10 hover:text-[#0396A6] transition-colors cursor-pointer"
                  >
                    <span>Outreach</span>
                  </button>

                  <a
                    href={chatHref}
                    onClick={() => setActionDropdownOpenId(null)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-[#0396A6]/10 hover:text-[#0396A6] transition-colors cursor-pointer"
                  >
                    <span>Open Chat</span>
                  </a>
                </div>
              </>
            )}
          </div>
        );
      }

      default:
        return "—";
    }
  }

  const headerTabs: TopbarTab[] = [
    {
      key: "overview",
      label: "Overview",
      icon: <Users size={15} className="text-[#0396A6]" />,
    },
    {
      key: "outreach",
      label: "Outreach",
      icon: <Send size={14} className="text-[#0396A6]" />,
    },
  ];

  return (
    <AppShell
      title="Leads"
      requires="leads:read"
      fullWidth={true}
      noScroll={true}
      headerTabs={
        <TopbarTabs
          tabs={headerTabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as "overview" | "outreach")}
        />
      }
    >
      <EntitlementGate feature="lead_capture">
      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}

      {activeTab === "outreach" ? (
        <div className="flex flex-col flex-1 min-h-0 h-full px-6 lg:px-8 py-4 overflow-hidden">
          <OutreachTab
            leads={leads}
            loading={loading}
            agents={agentsList}
            channelFilter={leadsChannelFilter}
            agentScope={leadsAgentScope}
            onChannelChange={handleLeadsChannelChange}
            onAgentChange={setLeadsAgentScope}
            onRefresh={() => void load()}
            onOpenOutreachDrawer={handleOpenOutreach}
            onOpenWhatsAppTemplateModal={handleOpenWhatsAppTemplate}
            onOpenFollowUpSettings={handleOpenFollowUpSettings}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            canWrite={canWrite}
          />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 px-6 lg:px-8 py-4 overflow-hidden">
          {/* ─── Main Workspace Controls & Filter Bar ─── */}
          <div className={styles.workspaceHeader}>
            {/* Row 1: Search, Temperature Quick Filters, Advanced Filters Toggle, and Actions */}
            <div className={styles.toolbar}>
          {/* Global Search */}
          <div className={styles.search}>
            <Search className={styles.searchIcon} size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads by name, email, phone, interest…"
              aria-label="Search leads"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Temperature Segmented Filter */}
          <div className={styles.segmentedGroup}>
            {(["all", "hot", "warm", "cold"] as const).map((t) => {
              const isActive = temp === t;
              const color =
                t === "hot"
                  ? "#ef4444"
                  : t === "warm"
                    ? "#f59e0b"
                    : t === "cold"
                      ? "#3b82f6"
                      : undefined;
              return (
                <button
                  key={t}
                  type="button"
                  className={`${styles.segmentedBtn} ${isActive ? styles.segmentedBtnActive : ""}`}
                  style={color && isActive ? { color } : undefined}
                  onClick={() => setTemp(t)}
                  aria-pressed={isActive}
                >
                  <span style={color && isActive ? { color } : undefined}>
                    {t === "all" ? "All" : t.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Column-Driven Filters Popover */}
          <div className="relative" ref={filterPopoverAnchorRef}>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${
                showFilterPopover || visibleActiveRules.length > 0 ? styles.filterToggleActive : ""
              }`}
              onClick={() => setShowFilterPopover((v) => !v)}
              aria-label="Toggle dynamic filters"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {visibleActiveRules.length > 0 && (
                <span className={styles.filterBadge}>{visibleActiveRules.length}</span>
              )}
              {showFilterPopover ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <DynamicFilterPopover
              isOpen={showFilterPopover}
              onClose={() => setShowFilterPopover(false)}
              visibleColumns={visibleColumns}
              customFields={customFields}
              appliedRules={filterRules}
              onApplyRules={(rules) => setFilterRules(rules)}
            />
          </div>

          {/* Date Range Filter (Darsh — kept on Anurag leads layout) */}
          <TableDateFilter
            preset={datePreset}
            fromDate={fromDate}
            toDate={toDate}
            onChange={(val) => {
              setDatePreset(val.preset);
              setFromDate(val.fromDate);
              setToDate(val.toDate);
            }}
          />

          {/* Add / Customize Columns Button above the table */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${
                showColSelector ? styles.filterToggleActive : ""
              }`}
              onClick={() => setShowColSelector((v) => !v)}
              aria-label="Add or customize columns"
            >
              <Plus size={14} />
              <span>Add Column</span>
            </button>

            {/* Column Selector Popover */}
            {showColSelector && (
              <div className={styles.colSelectorPopover}>
                <div className={styles.colSelectorHeader}>
                  <span className={styles.colSelectorTitle}>Customize Columns</span>
                </div>

                {/* "+ Add Custom Field" Action */}
                <button
                  type="button"
                  className={styles.addCustomFieldTriggerBtn}
                  onClick={handleOpenCreateCustomField}
                >
                  <span>+ Add Custom Field</span>
                </button>

                <div className={styles.colSelectorList}>
                  {/* Standard Columns */}
                  <div className={styles.colSectionTitle}>Standard Columns</div>
                  {STANDARD_COLUMNS.map((col) => {
                    const isVisible = visibleColumns.includes(col.id);
                    return (
                      <label key={col.id} className={styles.colSelectorItem}>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={!col.canHide}
                          onChange={() => toggleColumnVisibility(col.id)}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="flex-1 select-none">{col.label}</span>
                        {isVisible && (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            Visible
                          </span>
                        )}
                      </label>
                    );
                  })}

                  {/* Custom Columns (if any exist) */}
                  {customFields.length > 0 && (
                    <>
                      <div className={`${styles.colSectionTitle} mt-2`}>
                        Custom Fields ({customFields.length})
                      </div>
                      {customFields.map((cf) => {
                        const isVisible = visibleColumns.includes(cf.id);
                        return (
                          <div key={cf.id} className={styles.colSelectorItem}>
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(cf.id)}
                              className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                            />
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: cf.color }}
                            />
                            <span className="flex-1 select-none truncate font-medium">
                              {cf.name}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditCustomField(cf);
                                }}
                                className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-surface-container-high transition-colors"
                                title={`Edit ${cf.name}`}
                                aria-label={`Edit ${cf.name}`}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomField(cf.id);
                                }}
                                className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-surface-container-high transition-colors"
                                title={`Delete ${cf.name}`}
                                aria-label={`Delete ${cf.name}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className={styles.colSelectorActions}>
                  <button
                    type="button"
                    className={styles.colSelectorActionBtn}
                    onClick={resetToDefaultColumns}
                  >
                    <RotateCcw size={11} className="inline mr-1" />
                    Reset Default
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    {visibleColumns.length} of {allAvailableColumns.length} visible
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions: Export & New Lead */}
          <div className={`${styles.actions} ml-auto`}>
            <Button
              type="button"
              variant="ghost"
              onClick={exportCsv}
              disabled={!sorted.length}
              title={`Downloads the ${sorted.length} lead${sorted.length === 1 ? "" : "s"} shown`}
            >
              Export
            </Button>
            {canWrite ? (
              <Button type="button" onClick={() => setShowForm(true)}>
                <Plus size={16} />
                New lead
              </Button>
            ) : null}
          </div>
        </div>

        {/* Row 2: Channel + agent filter */}
        <LeadsChannelAgentFilter
          channel={leadsChannelFilter}
          agentScope={leadsAgentScope}
          agents={agentsList}
          onChannelChange={handleLeadsChannelChange}
          onAgentChange={setLeadsAgentScope}
        />

        {/* ─── Expandable Structured Advanced Filter Panel ─── */}
        {/* ─── Active Filter Chips Bar ─── */}
        {activeFiltersCount > 0 && (
          <div className={styles.activeChipsRow}>
            <span className="text-xs text-muted-foreground font-semibold mr-1">Active filters:</span>
            {query && (
              <span className={styles.activeChip}>
                Search: &ldquo;{query}&rdquo;
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setQuery("")}
                  aria-label="Clear search filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {temp !== "all" && (
              <span className={styles.activeChip}>
                Temp: {temp.toUpperCase()}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setTemp("all")}
                  aria-label="Clear temperature filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {status !== "all" && (
              <span className={styles.activeChip}>
                Status: {titleCase(status)}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setStatus("all")}
                  aria-label="Clear status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {leadsChannelFilter !== "all" && (
              <span className={styles.activeChip}>
                Channel: {leadsChannelFilter === "whatsapp" ? "WhatsApp" : "Website"}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => handleLeadsChannelChange("all")}
                  aria-label="Clear channel filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {leadsAgentScope !== "all" && (
              <span className={styles.activeChip}>
                Agent: {agentsList.find((a) => a.id === leadsAgentScope)?.agent_name || "Selected"}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => setLeadsAgentScope("all")}
                  aria-label="Clear agent filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Dynamic Column Filter Chips */}
            {visibleActiveRules.map((rule) => (
              <span key={rule.id} className={styles.activeChip}>
                {formatRuleChipLabel(rule)}
                <button
                  type="button"
                  className={styles.activeChipRemove}
                  onClick={() => removeFilterRule(rule.id)}
                  aria-label="Remove filter rule"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ─── Create Lead Modal ─── */}
      {showForm ? (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.createLeadModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalHeaderTitle}>Create lead</h3>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className={styles.createLeadForm} onSubmit={(e) => void onCreate(e)}>
              <div className={styles.createLeadGrid}>
                <Field
                  label="Name"
                  name="name"
                  value={form.name}
                  placeholder="e.g. Asha Sharma"
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder="e.g. asha@company.com"
                  onChange={(v) => setForm({ ...form, email: v })}
                />
                <Field
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  placeholder="e.g. +91 98765 43210"
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
                <Field
                  label="Budget"
                  name="budget"
                  value={form.budget}
                  placeholder="e.g. ₹50,000"
                  onChange={(v) => setForm({ ...form, budget: v })}
                />
              </div>
              <label className={styles.createLeadArea}>
                <span>Interest</span>
                <textarea
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  placeholder="What are they looking for?"
                  rows={2}
                />
              </label>
              <label className={styles.createLeadSelect}>
                <span>Temperature</span>
                <Select
                  value={form.temperature}
                  onChange={(val) =>
                    setForm({ ...form, temperature: val as Lead["temperature"] })
                  }
                  options={[
                    {
                      value: "hot",
                      label: <span style={{ color: "#ef4444", fontWeight: 600 }}>Hot</span>,
                    },
                    {
                      value: "warm",
                      label: <span style={{ color: "#f59e0b", fontWeight: 600 }}>Warm</span>,
                    },
                    {
                      value: "cold",
                      label: <span style={{ color: "#3b82f6", fontWeight: 600 }}>Cold</span>,
                    },
                  ]}
                />
              </label>
              <div className={styles.createLeadActions}>
                <Button type="submit" loading={busy}>
                  Save lead
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ─── Main Table Section ─── */}
      {loading ? (
        <div className={styles.tableOuter}>
          <div className={`${styles.tableWrap} no-scrollbar`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {activeOrderedColumns.map((col) => (
                    <th key={col.id} className={styles.th} style={{ minWidth: `${col.minWidth}px`, width: `${col.minWidth}px` }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {activeOrderedColumns.map((col, idx) => (
                      <td key={idx} className={styles.td}>
                        <div className="h-4 w-28 bg-muted/40 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !leads.length ? (
        <PageState
          icon="person_search"
          title="No leads yet"
          description="Create a lead manually, or promote a conversation from Inbox after a Sandbox chat."
          primaryHref="/inbox"
          primaryLabel="Open Inbox"
          secondaryHref="/website?tab=settings&subtab=sandbox"
          secondaryLabel="Open Sandbox"
        />
      ) : !sorted.length ? (
        <PageState
          icon="search_off"
          title="No matching leads"
          description="No leads match your current filter and search criteria. Try adjusting or clearing your filters."
          action={
            <Button variant="ghost" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className={styles.tableOuter}>
          <div className={`${styles.tableWrap} no-scrollbar`}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortableContext
                      items={activeOrderedColumns.map((c) => c.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {activeOrderedColumns.map((column) => (
                        <SortableHeaderCell
                          key={column.id}
                          column={column}
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      {activeOrderedColumns.map((col) => (
                        <td
                          key={col.id}
                          className={styles.td}
                          style={{
                            minWidth: `${col.minWidth}px`,
                            width: `${col.minWidth}px`,
                          }}
                        >
                          {renderCell(lead, col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DndContext>
          </div>

          {/* ─── Pagination Footer ─── */}
          {totalLeads > 0 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <span>
                  Showing <strong>{startIndex + 1}–{endIndex}</strong> of{" "}
                  <strong>{totalLeads}</strong> leads
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Rows per page:</span>
                  <div className="w-20">
                    <Select
                      size="sm"
                      value={String(pageSize)}
                      onChange={(val) => {
                        const newSize = Number(val);
                        setPageSize(newSize);
                        savePreferences(visibleColumns, columnOrder, newSize);
                      }}
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.paginationControls}>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={clampedPage === 1}
                  className={styles.pageBtn}
                  title="First page"
                  aria-label="First page"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={clampedPage === 1}
                  className={styles.pageBtn}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {getPageNumbers().map((pNum, idx) => {
                  if (pNum === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                        …
                      </span>
                    );
                  }
                  const isCurrent = pNum === clampedPage;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(Number(pNum))}
                      className={`${styles.pageBtn} ${isCurrent ? styles.pageBtnActive : ""}`}
                      aria-label={`Go to page ${pNum}`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={clampedPage === totalPages}
                  className={styles.pageBtn}
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={clampedPage === totalPages}
                  className={styles.pageBtn}
                  title="Last page"
                  aria-label="Last page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Create / Edit Custom Field Modal ─── */}
      {showCustomFieldModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCustomFieldModal(false)}>
          <div className={styles.customFieldModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className="flex items-center gap-2">
                {editingCustomFieldId ? (
                  <Pencil size={18} className="text-primary" />
                ) : (
                  <Sparkles size={18} className="text-primary" />
                )}
                <h3 className={styles.modalHeaderTitle}>
                  {editingCustomFieldId ? "Edit Custom Field" : "Create Custom Field"}
                </h3>
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowCustomFieldModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomField}>
              <div className={styles.modalBody}>
                {/* Form Fields */}
                <div className={styles.modalFormColumn}>
                  {customFieldError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-xs font-semibold">
                      {customFieldError}
                    </div>
                  )}

                  {/* Field Name */}
                  <div className={styles.filterField}>
                    <label className={styles.filterLabel}>Field Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Customer Type, Deal Stage, Priority"
                      className={styles.filterInput}
                      value={customFieldName}
                      onChange={(e) => {
                        setCustomFieldName(e.target.value);
                        setCustomFieldError(null);
                      }}
                    />
                  </div>

                  {/* Field Color */}
                  <div className={styles.filterField}>
                    <label className={styles.filterLabel}>Field Color Accent</label>
                    <div className={styles.colorSwatches}>
                      {PRESET_COLORS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          className={`${styles.colorSwatch} ${
                            customFieldColor === hex ? styles.colorSwatchActive : ""
                          }`}
                          style={{ backgroundColor: hex }}
                          onClick={() => setCustomFieldColor(hex)}
                        />
                      ))}
                      <input
                        type="color"
                        value={customFieldColor}
                        onChange={(e) => setCustomFieldColor(e.target.value)}
                        className="w-6 h-6 rounded-full border border-border cursor-pointer p-0 bg-transparent"
                        title="Pick custom hex color"
                      />
                    </div>
                  </div>

                  {/* Field Type Selection */}
                  <div className={styles.filterField}>
                    <label className={styles.filterLabel}>Field Type</label>
                    <div className={styles.fieldTypesGrid}>
                      {(Object.keys(FIELD_TYPE_CONFIG) as CustomFieldType[]).map((ft) => {
                        const info = FIELD_TYPE_CONFIG[ft];
                        const Icon = info.icon;
                        const isSelected = customFieldType === ft;
                        return (
                          <button
                            key={ft}
                            type="button"
                            className={`${styles.fieldTypeButton} ${
                              isSelected ? styles.fieldTypeButtonActive : ""
                            }`}
                            onClick={() => {
                              setCustomFieldType(ft);
                              setCustomFieldError(null);
                            }}
                          >
                            <Icon size={14} />
                            <span>{info.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Options for Select, Multi-Select, and Radio */}
                  {["select", "multi_select", "radio"].includes(customFieldType) && (
                    <div className={styles.filterField}>
                      <label className={styles.filterLabel}>Field Options</label>
                      <div className={styles.optionsBuilder}>
                        {customFieldOptions.map((opt, idx) => (
                          <div key={opt.id} className={styles.optionRow}>
                            <input
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              className={styles.optionInput}
                              value={opt.label}
                              onChange={(e) => {
                                const next = [...customFieldOptions];
                                next[idx] = { ...opt, label: e.target.value };
                                setCustomFieldOptions(next);
                              }}
                            />
                            <input
                              type="color"
                              className={styles.optionColorPicker}
                              value={opt.color || "#3b82f6"}
                              onChange={(e) => {
                                const next = [...customFieldOptions];
                                next[idx] = { ...opt, color: e.target.value };
                                setCustomFieldOptions(next);
                              }}
                              title="Option tag color"
                            />
                            {customFieldOptions.length > 1 && (
                              <button
                                type="button"
                                className={styles.removeOptionBtn}
                                onClick={() =>
                                  setCustomFieldOptions((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.addOptionButton}
                          onClick={() =>
                            setCustomFieldOptions((prev) => [
                              ...prev,
                              {
                                id: `opt_${Date.now()}`,
                                label: `Option ${prev.length + 1}`,
                                color: PRESET_COLORS[(prev.length + 1) % PRESET_COLORS.length] || "#3b82f6",
                              },
                            ])
                          }
                        >
                          <Plus size={13} />
                          <span>Add Option</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Currency Configuration */}
                  {customFieldType === "currency" && (
                    <div className={styles.filterField}>
                      <label className={styles.filterLabel}>Currency Symbol</label>
                      <select
                        className={styles.filterSelect}
                        value={customFieldCurrency}
                        onChange={(e) => setCustomFieldCurrency(e.target.value)}
                      >
                        <option value="$">USD ($)</option>
                        <option value="₹">INR (₹)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="A$">AUD (A$)</option>
                        <option value="C$">CAD (C$)</option>
                        <option value="¥">JPY / CNY (¥)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Live Preview Column */}
                <div className={styles.modalPreviewColumn}>
                  <div className={styles.previewHeading}>Live Table Preview</div>
                  <div className={styles.previewCard}>
                    {/* Header Preview */}
                    <div className={styles.previewHeader}>
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: customFieldColor }}
                      />
                      <span className="font-bold truncate">
                        {customFieldName.trim() || "Field Name"}
                      </span>
                    </div>

                    {/* Cell Preview */}
                    <div className="py-2">
                      <span className="text-[10.5px] uppercase font-bold text-muted-foreground block mb-1">
                        Table Cell Interaction:
                      </span>
                      {customFieldType === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded text-primary h-4 w-4"
                          />
                          <span className="text-xs text-muted-foreground">Enabled</span>
                        </div>
                      ) : ["select", "radio"].includes(customFieldType) ? (
                        <select className={styles.filterSelect}>
                          {customFieldOptions
                            .filter((o) => o.label.trim().length > 0)
                            .map((o) => (
                              <option key={o.id}>{o.label}</option>
                            ))}
                        </select>
                      ) : customFieldType === "multi_select" ? (
                        <div className="flex flex-wrap gap-1">
                          {customFieldOptions
                            .filter((o) => o.label.trim().length > 0)
                            .map((o) => (
                              <span
                                key={o.id}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                                style={{
                                  backgroundColor: `${customFieldColor}15`,
                                  borderColor: `${customFieldColor}40`,
                                  color: customFieldColor,
                                }}
                              >
                                {o.label}
                              </span>
                            ))}
                        </div>
                      ) : customFieldType === "currency" ? (
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          <span className="text-muted-foreground">{customFieldCurrency}</span>
                          <span>2,500.00</span>
                        </div>
                      ) : customFieldType === "date" ? (
                        <span className="text-xs font-mono text-muted-foreground">
                          2026-08-18
                        </span>
                      ) : (
                        <input
                          type="text"
                          readOnly
                          placeholder={`Sample ${customFieldType} value`}
                          className={styles.customCellInput}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Custom fields appear as columns in your Leads table, can be dragged to reorder,
                    and edited inline for each individual lead.
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCustomFieldModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCustomFieldId ? (
                    <>
                      <Pencil size={14} />
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Create Field</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      )}
      </EntitlementGate>

      {/* ─── Shared Outreach Action Drawer ─── */}
      <OutreachDrawer
        open={isOutreachDrawerOpen}
        lead={outreachLead}
        onClose={() => setIsOutreachDrawerOpen(false)}
        onSuccess={(msg) => {
          toastSuccess(msg);
          void load();
        }}
        onRequestTemplateModal={(l) => {
          setIsOutreachDrawerOpen(false);
          handleOpenWhatsAppTemplate(l);
        }}
      />

      {/* ─── Shared WhatsApp 24-Hour Meta Template Modal ─── */}
      <WhatsAppTemplateModal
        open={isTemplateModalOpen}
        lead={templateModalLead}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={(msg) => {
          toastSuccess(msg);
          void load();
        }}
      />

      {/* ─── Follow-up Settings Panel Modal ─── */}
      <FollowUpSettingsPanel
        open={showFollowUpSettings}
        onClose={() => setShowFollowUpSettings(false)}
        onSave={handleSaveFollowUpSettings}
        initial={followUpSettings}
      />
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorBox, Loading, PageState } from "@/components/ui/PageState";
import { apiRequest } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useToast } from "@/lib/toast";
import { QUOTE_STATUSES, type Product, type Quotation, type QuoteSendResult } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { TemplatesTab, type TemplatesTabHandle } from "./TemplatesTab";
import {
  Search,
  Plus,
  FileText,
  Package,
  LayoutTemplate,
  Send,
  Download,
  CheckCircle2,
  Copy,
  Trash2,
  Eye,
  Edit3,
  ShieldAlert,
  Sparkles,
  RotateCw,
  Filter,
  ArrowUpDown,
  RotateCcw,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  User,
  Calendar,
  Check,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";
import styles from "./quotes.module.css";

type DeliveryRecord = {
  id: string;
  quotation_id: string;
  channel: string;
  recipient: string;
  status: string;
  error_message?: string;
  created_at: string;
};

export default function QuotesPage() {
  const { me, merchant } = useWorkspace();
  const canSend = can(me?.permissions, "quotations:send");
  const canCatalogWrite = can(me?.permissions, "catalog:write");

  const [tab, setTab] = useState<"quotes" | "catalog" | "templates">("quotes");
  const [quotes, setQuotes] = useState<Quotation[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Filter Funnel & Sorting States (Excel Style)
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const templatesTabRef = useRef<TemplatesTabHandle>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...QUOTE_STATUSES]);
  const [sortField, setSortField] = useState<"created_at" | "total_with_gst" | "title" | "status" | "recipient_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "last_7" | "last_30">("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [targetUpdateStatus, setTargetUpdateStatus] = useState("sent");
  const [batchBusy, setBatchBusy] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, dateRangeFilter, minAmount, maxAmount, sortField, sortOrder, pageSize]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);

  // Dropdown Open States for Custom Dropdowns
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null);

  const [detailStatusDropdownOpen, setDetailStatusDropdownOpen] = useState(false);
  const detailStatusDropdownRef = useRef<HTMLDivElement>(null);

  const [catalogSortDropdownOpen, setCatalogSortDropdownOpen] = useState(false);
  const catalogSortDropdownRef = useRef<HTMLDivElement>(null);

  const [catalogPageSizeDropdownOpen, setCatalogPageSizeDropdownOpen] = useState(false);
  const catalogPageSizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setPageSizeDropdownOpen(false);
      }
      if (detailStatusDropdownRef.current && !detailStatusDropdownRef.current.contains(event.target as Node)) {
        setDetailStatusDropdownOpen(false);
      }
      if (catalogSortDropdownRef.current && !catalogSortDropdownRef.current.contains(event.target as Node)) {
        setCatalogSortDropdownOpen(false);
      }
      if (catalogPageSizeDropdownRef.current && !catalogPageSizeDropdownRef.current.contains(event.target as Node)) {
        setCatalogPageSizeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleAllStatuses = () => {
    if (selectedStatuses.length === QUOTE_STATUSES.length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([...QUOTE_STATUSES]);
    }
  };

  const handleToggleStatus = (st: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatuses.length < QUOTE_STATUSES.length) count++;
    if (sortField !== "created_at" || sortOrder !== "desc") count++;
    if (dateRangeFilter !== "all") count++;
    if (minAmount.trim() !== "") count++;
    if (maxAmount.trim() !== "") count++;
    return count;
  }, [selectedStatuses, sortField, sortOrder, dateRangeFilter, minAmount, maxAmount]);

  const resetAllFilters = () => {
    setSelectedStatuses([...QUOTE_STATUSES]);
    setSortField("created_at");
    setSortOrder("desc");
    setDateRangeFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setSearchQuery("");
  };

  const { showToast } = useToast();
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "error" });
    },
    [showToast]
  );
  const setNotice = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "success" });
    },
    [showToast]
  );
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);

  // Create Quote Form State
  const [qTitle, setQTitle] = useState("");
  const [qRecipientName, setQRecipientName] = useState("");
  const [qRecipientEmail, setQRecipientEmail] = useState("");
  const [qRecipientPhone, setQRecipientPhone] = useState("");
  const [qGstRate, setQGstRate] = useState("18");
  const [qLineItems, setQLineItems] = useState<Array<{ product_id: string; description: string; quantity: string; unit_price: string }>>([]);
  const [selectedProdForQuote, setSelectedProdForQuote] = useState("");
  const [quoteProdQty, setQuoteProdQty] = useState("1");

  // Catalogue Product Form State
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pNameTouched, setPNameTouched] = useState(false);
  const [pPriceTouched, setPPriceTouched] = useState(false);
  const [pFormError, setPFormError] = useState<string | null>(null);

  // Edit Product Modal State
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdDesc, setEditProdDesc] = useState("");
  const [editProdNameTouched, setEditProdNameTouched] = useState(false);
  const [editProdPriceTouched, setEditProdPriceTouched] = useState(false);
  const [editProdFormError, setEditProdFormError] = useState<string | null>(null);

  // Confirmation Modal States
  const [deactivateProductTarget, setDeactivateProductTarget] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Frontend Catalogue Item Validation Helpers
  const validateProdName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Product or service name is required.";
    if (trimmed.length < 2) return "Product name must be at least 2 characters.";
    if (trimmed.length > 100) return "Product name cannot exceed 100 characters.";
    return null;
  };

  const validateProdPrice = (priceStr: string): string | null => {
    const trimmed = priceStr.trim();
    if (!trimmed) return "Unit price is required.";
    const num = Number(trimmed);
    if (isNaN(num)) return "Please enter a valid numeric price (e.g. 4999.00).";
    if (num <= 0) return "Price must be greater than ₹0.00.";
    if (num > 100000000) return "Price cannot exceed ₹100,000,000.";
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return "Price can have at most 2 decimal places (e.g. 4999.50).";
    }
    return null;
  };

  const validateProdDesc = (desc: string): string | null => {
    if (desc.trim().length > 500) return "Description cannot exceed 500 characters.";
    return null;
  };

  // Catalogue Filtering, Sorting & Pagination
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [catalogSortField, setCatalogSortField] = useState<"name" | "price" | "status">("name");
  const [catalogSortOrder, setCatalogSortOrder] = useState<"asc" | "desc">("asc");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);
  const [mobileKpisExpanded, setMobileKpisExpanded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") qs.set("status", statusFilter);
      const list = await apiRequest<Quotation[]>(`/v1/quotations?${qs}`);
      setQuotes(list);

      // Auto-select first quotation if none selected
      if (list && list.length > 0) {
        setSelectedId((prev) => prev || list[0]?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your quotations");
      setQuotes([]);
    }
    try {
      const cat = await apiRequest<Product[]>("/v1/catalog/products?limit=100&include_inactive=true");
      setProducts(cat);
      if (cat && cat.length > 0) {
        setSelectedProdForQuote((prev) => prev || cat[0]?.id || "");
      }
    } catch {
      setProducts([]);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshSelected = useCallback(async (targetId?: string | null) => {
    const id = targetId || selectedId;
    if (!id) return;
    try {
      const [full, logs] = await Promise.all([
        apiRequest<Quotation>(`/v1/quotations/${id}`),
        apiRequest<DeliveryRecord[]>(`/v1/quotations/${id}/deliveries`).catch(() => []),
      ]);
      setSelected(full);
      if (Array.isArray(logs)) setDeliveries(logs);
    } catch {
      // Keep existing state if fetch fails
    }
  }, [selectedId]);

  // Load detailed quotation and delivery records when selected
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setDeliveries([]);
      return;
    }
    let cancelled = false;
    apiRequest<Quotation>(`/v1/quotations/${selectedId}`)
      .then((full) => {
        if (!cancelled) setSelected(full);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSelected(null);
          setError(err instanceof Error ? err.message : "Could not open that quotation");
        }
      });

    // Load delivery logs
    apiRequest<DeliveryRecord[]>(`/v1/quotations/${selectedId}/deliveries`)
      .then((logs) => {
        if (!cancelled && Array.isArray(logs)) setDeliveries(logs);
      })
      .catch(() => {
        if (!cancelled) setDeliveries([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Add line item to draft quotation modal
  const handleAddLineToDraft = () => {
    const p = products.find((pr) => pr.id === selectedProdForQuote);
    if (!p) return;
    setQLineItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        description: p.name,
        quantity: quoteProdQty || "1",
        unit_price: p.unit_price || "0",
      },
    ]);
    setQuoteProdQty("1");
  };

  // Remove line item from draft quotation modal
  const handleRemoveLineFromDraft = (idx: number) => {
    setQLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Create New Quotation
  const handleCreateQuotationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || qLineItems.length === 0) {
      setError("Please specify a title and add at least one catalogue product.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const newQuote = await apiRequest<Quotation>("/v1/quotations", {
        method: "POST",
        body: {
          title: qTitle.trim(),
          recipient_name: qRecipientName.trim() || null,
          recipient_email: qRecipientEmail.trim() || null,
          recipient_phone: qRecipientPhone.trim() || null,
          gst_rate: qGstRate,
          tax_treatment: "domestic",
          items: qLineItems.map((it) => ({
            product_id: it.product_id,
            description: it.description,
            quantity: String(it.quantity),
            unit_price: String(it.unit_price),
          })),
        },
      });

      setQTitle("");
      setQRecipientName("");
      setQRecipientEmail("");
      setQRecipientPhone("");
      setQLineItems([]);
      setCreateQuoteOpen(false);
      setNotice("Quotation created successfully.");

      await load();
      setSelectedId(newQuote.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create quotation.");
    } finally {
      setBusy(false);
    }
  };

  // Add Product to Catalogue with complete validation
  async function addProduct(e: FormEvent) {
    e.preventDefault();
    setPNameTouched(true);
    setPPriceTouched(true);
    setPFormError(null);

    const nameErr = validateProdName(pName);
    if (nameErr) {
      setPFormError(nameErr);
      return;
    }
    const priceErr = validateProdPrice(pPrice);
    if (priceErr) {
      setPFormError(priceErr);
      return;
    }
    const descErr = validateProdDesc(pDesc);
    if (descErr) {
      setPFormError(descErr);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<Product>("/v1/catalog/products", {
        method: "POST",
        body: { name: pName.trim(), unit_price: Number(pPrice.trim()).toFixed(2), description: pDesc.trim() || null },
      });
      setPName("");
      setPPrice("");
      setPDesc("");
      setPNameTouched(false);
      setPPriceTouched(false);
      setPFormError(null);
      setCreateProductOpen(false);
      setNotice("Added to your product catalogue.");
      await load();
    } catch (err) {
      setPFormError(err instanceof Error ? err.message : "Could not add that product.");
    } finally {
      setBusy(false);
    }
  }

  // Toggle Catalogue Product Active State
  async function toggleProductActive(p: Product) {
    setBusy(true);
    try {
      await apiRequest(`/v1/catalog/products/${p.id}`, {
        method: "PATCH",
        body: { is_active: !p.is_active },
      });
      setNotice(p.is_active ? `"${p.name}" has been deactivated.` : `"${p.name}" has been activated.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update product state.");
    } finally {
      setBusy(false);
    }
  }

  // Delete Catalogue Product
  async function deleteProduct(p: Product) {
    setBusy(true);
    try {
      await apiRequest(`/v1/catalog/products/${p.id}`, { method: "DELETE" });
      // API soft-deletes (deactivates); keep state in sync without refetching inactive rows back into "All".
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_active: false } : x))
      );
      setNotice(`"${p.name}" has been deleted from your catalogue.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that product.");
    } finally {
      setBusy(false);
    }
  }

  // Edit Catalogue Product Handler
  const startEditProduct = (p: Product) => {
    setEditProdId(p.id);
    setEditProdName(p.name);
    setEditProdPrice(String(p.unit_price || "0"));
    setEditProdDesc(p.description || "");
    setEditProdNameTouched(false);
    setEditProdPriceTouched(false);
    setEditProdFormError(null);
    setEditProductOpen(true);
  };

  const handleEditProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProdId) return;
    setEditProdNameTouched(true);
    setEditProdPriceTouched(true);
    setEditProdFormError(null);

    const nameErr = validateProdName(editProdName);
    if (nameErr) {
      setEditProdFormError(nameErr);
      return;
    }
    const priceErr = validateProdPrice(editProdPrice);
    if (priceErr) {
      setEditProdFormError(priceErr);
      return;
    }
    const descErr = validateProdDesc(editProdDesc);
    if (descErr) {
      setEditProdFormError(descErr);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<Product>(`/v1/catalog/products/${editProdId}`, {
        method: "PATCH",
        body: {
          name: editProdName.trim(),
          unit_price: Number(editProdPrice.trim()).toFixed(2),
          description: editProdDesc.trim() || null,
        },
      });
      setEditProductOpen(false);
      setEditProdId(null);
      setEditProdFormError(null);
      setNotice("Catalogue item updated successfully.");
      await load();
    } catch (err) {
      setEditProdFormError(err instanceof Error ? err.message : "Could not update that product.");
    } finally {
      setBusy(false);
    }
  };

  // Approve Quotation
  async function handleApproveQuotation(q: Quotation) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/quotations/${q.id}/approve`, { method: "POST" });
      setNotice("Quotation approved and released.");
      await Promise.all([load(), refreshSelected(q.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve quotation.");
    } finally {
      setBusy(false);
    }
  }

  // Quick Change Status
  async function handleStatusChange(q: Quotation, newStatus: string) {
    if (newStatus === "accepted" || newStatus === "rejected") {
      const label = newStatus === "accepted" ? "Accepted (Won)" : "Rejected (Lost)";
      if (
        !window.confirm(
          `Mark this quotation as ${label}?\n\nThis locks the quote and stops any active follow-up nudges.`,
        )
      ) {
        return;
      }
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${q.id}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      setSelected(updated);
      setNotice(`Status updated to ${newStatus.toUpperCase()}.`);
      await Promise.all([load(), refreshSelected(q.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  // PDF Generation & Download
  async function generatePdf(q: Quotation) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/quotations/${q.id}/pdf`, { method: "POST" });
      setNotice("PDF generated with GST breakdown.");
      await Promise.all([load(), refreshSelected(q.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(q: Quotation) {
    setBusy(true);
    setError(null);
    try {
      const out = await apiRequest<{ url?: string; signed_url?: string }>(`/v1/quotations/${q.id}/pdf`);
      const targetUrl = out.url || out.signed_url;
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("No PDF has been generated for this quotation yet.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch the PDF.");
    } finally {
      setBusy(false);
    }
  }

  // Send Quotation via Email
  async function send(q: Quotation) {
    if (!q.recipient_email) {
      setError("This quotation has no recipient email.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const out = await apiRequest<QuoteSendResult>(`/v1/quotations/${q.id}/send`, {
        method: "POST",
        body: { channel: "email" },
      });
      setNotice(
        out.transport_configured
          ? `Sent successfully to ${out.recipient || q.recipient_email}.`
          : "Recorded, but no email transport is configured — contact admin.",
      );
      await Promise.all([load(), refreshSelected(q.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that quotation.");
    } finally {
      setBusy(false);
    }
  }

  // Copy Quote Token ID (copies raw token ID / UUID without URL prefix)
  const copyQuoteId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(id);
    }
    setCopiedId(true);
    setNotice(`Quotation ID #${id.slice(0, 8)} copied to clipboard.`);
    setTimeout(() => {
      setCopiedId(false);
      setNotice(null);
    }, 2000);
  };

  // Copy Preview / Share Link (Environment-safe for localhost, preview, and production domains)
  const copyShareLink = (q: Quotation) => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || "");
    const link = `${origin}/quotes/${q.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(link);
    }
    setCopiedLink(true);
    setNotice("Preview link copied to clipboard.");
    setTimeout(() => {
      setCopiedLink(false);
      setNotice(null);
    }, 2000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const list = quotes || [];
    const acceptedValue = list
      .filter((q) => q.status === "accepted")
      .reduce((n, q) => n + Number(q.total_with_gst || 0), 0);
    const total = list.reduce((n, q) => n + Number(q.total_with_gst || 0), 0);
    return {
      count: list.length,
      draft: list.filter((q) => q.status === "draft").length,
      sent: list.filter((q) => ["sent", "viewed"].includes(q.status)).length,
      accepted: list.filter((q) => q.status === "accepted").length,
      acceptedValue,
      total,
    };
  }, [quotes]);

  // Filtered & Sorted Lists (Excel Multi-select & Sort)
  const filteredQuotes = useMemo(() => {
    let list = quotes || [];

    // 1. Text Search Query (supports title, ID token, #tags, URLs, recipient info, status)
    if (searchQuery.trim()) {
      let rawQuery = searchQuery.trim().toLowerCase();
      if (rawQuery.includes("/quotes/")) {
        const parts = rawQuery.split("/quotes/");
        const lastPart = parts[parts.length - 1] ?? "";
        rawQuery = (lastPart.split("?")[0] ?? "").split("#")[0]?.trim() ?? "";
      }
      const cleanIdQuery = rawQuery.replace(/^#/, "").trim();

      list = list.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(rawQuery);
        const idMatch =
          Boolean(cleanIdQuery) &&
          (item.id?.toLowerCase().includes(cleanIdQuery) ||
            item.id?.toLowerCase().startsWith(cleanIdQuery));
        const nameMatch = item.recipient_name && item.recipient_name.toLowerCase().includes(rawQuery);
        const emailMatch = item.recipient_email && item.recipient_email.toLowerCase().includes(rawQuery);
        const phoneMatch = item.recipient_phone && item.recipient_phone.toLowerCase().includes(rawQuery);
        const statusMatch = item.status && item.status.toLowerCase() === rawQuery;

        return titleMatch || idMatch || nameMatch || emailMatch || phoneMatch || statusMatch;
      });
    }

    // 2. Status Multi-select Filter (Excel style)
    if (selectedStatuses.length < QUOTE_STATUSES.length) {
      list = list.filter((item) => selectedStatuses.includes(item.status));
    }

    // 3. Date Range Filter
    if (dateRangeFilter !== "all") {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      list = list.filter((item) => {
        const itemTime = new Date(item.created_at).getTime();
        if (isNaN(itemTime)) return true;
        if (dateRangeFilter === "today") return now - itemTime <= dayMs;
        if (dateRangeFilter === "last_7") return now - itemTime <= 7 * dayMs;
        if (dateRangeFilter === "last_30") return now - itemTime <= 30 * dayMs;
        return true;
      });
    }

    // 4. Amount Range Filter
    if (minAmount.trim()) {
      const minVal = parseFloat(minAmount);
      if (!isNaN(minVal)) {
        list = list.filter((item) => Number(item.total_with_gst || item.amount || 0) >= minVal);
      }
    }
    if (maxAmount.trim()) {
      const maxVal = parseFloat(maxAmount);
      if (!isNaN(maxVal)) {
        list = list.filter((item) => Number(item.total_with_gst || item.amount || 0) <= maxVal);
      }
    }

    // 5. Sorting
    return [...list].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "created_at") {
        aVal = new Date(a.created_at).getTime() || 0;
        bVal = new Date(b.created_at).getTime() || 0;
      } else if (sortField === "total_with_gst") {
        aVal = Number(a.total_with_gst || a.amount || 0);
        bVal = Number(b.total_with_gst || b.amount || 0);
      } else if (sortField === "title") {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      } else if (sortField === "status") {
        aVal = (a.status || "").toLowerCase();
        bVal = (b.status || "").toLowerCase();
      } else if (sortField === "recipient_name") {
        aVal = (a.recipient_name || a.recipient_email || "").toLowerCase();
        bVal = (b.recipient_name || b.recipient_email || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [quotes, searchQuery, selectedStatuses, dateRangeFilter, minAmount, maxAmount, sortField, sortOrder]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredQuotes.length / pageSize));
  }, [filteredQuotes.length, pageSize]);

  const paginatedQuotes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotes.slice(start, start + pageSize);
  }, [filteredQuotes, currentPage, pageSize]);

  const handleBatchStatusUpdate = async (targetStatus: string) => {
    if (!filteredQuotes.length) return;
    const targets = filteredQuotes.filter((q) => q.status !== targetStatus && q.status !== "accepted" && q.status !== "rejected");
    if (!targets.length) {
      setError(`All matching quotations are already in ${targetStatus.toUpperCase()} status or locked.`);
      return;
    }
    if (!window.confirm(`Update status of ${targets.length} quotation(s) to "${targetStatus.toUpperCase()}"?`)) {
      return;
    }
    setBatchBusy(true);
    setError(null);
    setNotice(null);
    try {
      let count = 0;
      for (const q of targets) {
        await apiRequest(`/v1/quotations/${q.id}`, {
          method: "PATCH",
          body: { status: targetStatus },
        });
        count++;
      }
      setNotice(`Successfully updated ${count} quotation(s) status to ${targetStatus.toUpperCase()}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute batch status update.");
    } finally {
      setBatchBusy(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = products || [];

    // 1. Status Filter — "all" shows active catalogue items only; inactive tab holds deactivated/deleted rows.
    if (catalogStatusFilter === "inactive") {
      list = list.filter((p) => !p.is_active);
    } else {
      list = list.filter((p) => p.is_active);
    }

    // 2. Search query
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    return [...list].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (catalogSortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (catalogSortField === "price") {
        aVal = Number(a.unit_price || 0);
        bVal = Number(b.unit_price || 0);
      } else if (catalogSortField === "status") {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      }

      if (aVal < bVal) return catalogSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return catalogSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, catalogStatusFilter, catalogSearch, catalogSortField, catalogSortOrder]);

  const catalogActiveCount = useMemo(
    () => (products || []).filter((p) => p.is_active).length,
    [products]
  );

  const catalogHasSearchFilter = Boolean(catalogSearch.trim());

  const catalogTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedProducts.length / catalogPageSize));
  }, [filteredAndSortedProducts.length, catalogPageSize]);

  const paginatedCatalogProducts = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredAndSortedProducts.slice(start, start + catalogPageSize);
  }, [filteredAndSortedProducts, catalogPage, catalogPageSize]);

  function badgeFor(status: string): string | undefined {
    if (status === "draft") return styles.badgeDraft;
    if (status === "sent") return styles.badgeSent;
    if (status === "viewed") return styles.badgeViewed;
    if (status === "accepted") return styles.badgeAccepted;
    if (status === "rejected") return styles.badgeRejected;
    if (status === "expired" || status === "revised") return styles.badgeExpired;
    return styles.badgeOther;
  }

  async function handleMarkOutcome(q: Quotation, outcome: "accepted" | "rejected") {
    const label = outcome === "accepted" ? "Accepted (Won)" : "Rejected (Lost)";
    if (
      !window.confirm(
        `Mark this quotation as ${label}?\n\nThis locks the quote and stops any active follow-up nudges.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${q.id}`, {
        method: "PATCH",
        body: { status: outcome },
      });
      setSelected(updated);
      setNotice(`Marked as ${label}. Follow-ups stopped.`);
      await Promise.all([load(), refreshSelected(q.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReviseQuotation(q: Quotation) {
    if (
      !window.confirm(
        "Create a new draft revision of this quotation?\n\nThe current quote will be marked Revised and its follow-ups will stop.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiRequest<Quotation>(`/v1/quotations/${q.id}/revise`, {
        method: "POST",
        body: {},
      });
      setSelected(created);
      setSelectedId(created.id);
      setNotice("Revision created as a new draft. Prior quote marked Revised.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create revision.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResumeFollowup(quotationId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quotationId}/followup/resume`, {
        method: "POST",
        body: {},
      });
      setSelected(updated);
      setNotice("Quote follow-up drip resumed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume follow-up.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePauseFollowup(quotationId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiRequest<Quotation>(`/v1/quotations/${quotationId}/followup/pause`, {
        method: "POST",
        body: {},
      });
      setSelected(updated);
      setNotice("Quote follow-up drip paused.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pause follow-up.");
    } finally {
      setBusy(false);
    }
  }

  if (quotes === null) return <Loading label="Loading your quotations…" />;

  const quotesHeaderTabs: TopbarTab[] = [
    { key: "quotes", label: "Quotations", icon: <FileText className="w-3.5 h-3.5" /> },
    { key: "catalog", label: "Catalogue", icon: <Package className="w-3.5 h-3.5" /> },
    { key: "templates", label: "Templates", icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  ];

  return (
    <AppShell
      title="Quotations"
      requires="quotations:view"
      fullWidth={true}
      noScroll={true}
      headerTabs={
        <TopbarTabs
          tabs={quotesHeaderTabs}
          activeTab={tab}
          onTabChange={(key) => setTab(key as "quotes" | "catalog" | "templates")}
        />
      }
    >
      <EntitlementGate feature="quotations">
        <div className={styles.page}>
          {tab === "quotes" ? (
            <div className="flex-1 flex flex-col min-h-0 md:overflow-hidden gap-3">
              {/* ── KPI Strip (Desktop grid + Mobile collapsible) ── */}
              <div className="flex flex-col gap-2">
                {/* Mobile Quick Summary Bar with Toggle */}
                <div className="flex md:hidden items-center justify-between px-3 py-2 rounded-xl bg-white border border-border/80 text-xs shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
                    <span className="font-bold text-foreground truncate">{kpis.count} Quotes</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-bold text-primary truncate">{inr(kpis.total)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-emerald-600 font-semibold truncate">{kpis.accepted} Won</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileKpisExpanded((prev) => !prev)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 ml-1"
                  >
                    <span>{mobileKpisExpanded ? "Hide" : "Stats"}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mobileKpisExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* KPI Cards Grid (Always visible on desktop, toggleable on mobile) */}
                <div className={`${mobileKpisExpanded ? "grid" : "hidden md:grid"} ${styles.kpis}`}>
                  <div className={styles.kpi}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>Total Quotes</span>
                      <div className={styles.kpiIconBadge}>
                        <FileText size={16} />
                      </div>
                    </div>
                    <p className={styles.kpiValue}>{kpis.count}</p>
                  </div>

                  <div className={styles.kpi}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>Draft</span>
                      <div className={styles.kpiIconBadge}>
                        <Clock size={16} />
                      </div>
                    </div>
                    <p className={styles.kpiValue}>{kpis.draft}</p>
                  </div>

                  <div className={styles.kpi}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>Sent</span>
                      <div className={styles.kpiIconBadge}>
                        <Send size={16} />
                      </div>
                    </div>
                    <p className={styles.kpiValue}>{kpis.sent}</p>
                  </div>

                  <div className={styles.kpi}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>Accepted</span>
                      <div className={styles.kpiIconBadge}>
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <p className={styles.kpiValue}>{kpis.accepted}</p>
                  </div>

                  <div className={styles.kpi}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>Pipeline Value</span>
                      <div className={styles.kpiIconBadge}>
                        <IndianRupee size={16} />
                      </div>
                    </div>
                    <p className={styles.kpiValue} style={{ fontSize: "1.25rem" }}>{inr(kpis.total)}</p>
                  </div>
                </div>
              </div>

              {/* Unified Enlarged Capsule Control Bar */}
              <div className={styles.toolbarTrack}>
                {/* Left Section: Status Segmented Tabs */}
                <div className={styles.filters}>
                  <button
                    type="button"
                    className={selectedStatuses.length === QUOTE_STATUSES.length ? styles.filterActive : styles.filter}
                    onClick={() => setSelectedStatuses([...QUOTE_STATUSES])}
                  >
                    all
                  </button>
                  {QUOTE_STATUSES.map((s) => {
                    const isSelected = selectedStatuses.length === 1 && selectedStatuses[0] === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={isSelected ? styles.filterActive : styles.filter}
                        onClick={() => setSelectedStatuses([s])}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Right Group: Small Fixed Search Box + Filter Funnel Button (Right-most) */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {/* Search Box (Fixed width w-36 sm:w-40, distinct crisp border) */}
                  <div className="flex items-center gap-1.5 bg-white rounded-full border border-border/90 hover:border-border px-2.5 py-1 text-xs shadow-2xs w-36 sm:w-40 shrink-0 transition-colors focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/70 p-0"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Funnel Button */}
                  <div className="relative shrink-0" ref={filterRef}>
                    <button
                      type="button"
                      onClick={() => setFilterOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-2xs h-7 ${
                        filterOpen || activeFilterCount > 0
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-white hover:bg-muted/80 text-foreground border-border/60"
                      }`}
                      title="Filter & Sort Quotations"
                    >
                      <Filter className="w-3.5 h-3.5 shrink-0" />
                      <span>Filter</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${filterOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Filter Funnel Popover Menu */}
                    {filterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-xl border border-border/60 bg-card text-card-foreground shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Filter</span>
                          <div className="flex items-center gap-1.5">
                            {activeFilterCount > 0 && (
                              <button
                                type="button"
                                onClick={resetAllFilters}
                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setFilterOpen(false)}
                              className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sort Options */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Sort By
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              value={sortField}
                              onChange={(e) => setSortField(e.target.value as any)}
                              className="w-full text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                            >
                              <option value="created_at">Date Created</option>
                              <option value="total_with_gst">Total Amount</option>
                              <option value="title">Title</option>
                              <option value="status">Status</option>
                              <option value="recipient_name">Recipient</option>
                            </select>

                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as any)}
                              className="w-full text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                            >
                              {sortField === "created_at" && (
                                <>
                                  <option value="desc">Newest to Oldest</option>
                                  <option value="asc">Oldest to Newest</option>
                                </>
                              )}
                              {sortField === "total_with_gst" && (
                                <>
                                  <option value="desc">Largest to Smallest</option>
                                  <option value="asc">Smallest to Largest</option>
                                </>
                              )}
                              {(sortField === "title" || sortField === "status" || sortField === "recipient_name") && (
                                <>
                                  <option value="asc">A to Z</option>
                                  <option value="desc">Z to A</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Status Multi-Select */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Status
                            </label>
                            <button
                              type="button"
                              onClick={handleToggleAllStatuses}
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              {selectedStatuses.length === QUOTE_STATUSES.length ? "Deselect All" : "Select All"}
                            </button>
                          </div>

                          <div className="rounded border border-border/60 bg-background p-1.5 max-h-28 overflow-y-auto space-y-0.5 text-[11px]">
                            <label className="flex items-center gap-1.5 cursor-pointer py-0.5 hover:bg-[#E2F6F9]/50 rounded px-1 font-medium transition-colors duration-150">
                              <input
                                type="checkbox"
                                checked={selectedStatuses.length === QUOTE_STATUSES.length}
                                onChange={handleToggleAllStatuses}
                                className="rounded border-border accent-primary w-3.5 h-3.5"
                              />
                              <span>(Select All)</span>
                            </label>

                            {QUOTE_STATUSES.map((st) => {
                              return (
                                <label key={st} className="flex items-center justify-between cursor-pointer py-0.5 hover:bg-[#E2F6F9]/50 rounded px-1 transition-colors duration-150">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={selectedStatuses.includes(st)}
                                      onChange={() => handleToggleStatus(st)}
                                      className="rounded border-border accent-primary w-3.5 h-3.5"
                                    />
                                    <span className="capitalize">{st}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Date Range
                          </label>
                          <select
                            value={dateRangeFilter}
                            onChange={(e) => setDateRangeFilter(e.target.value as any)}
                            className="w-full text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                          >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="last_7">Last 7 Days</option>
                            <option value="last_30">Last 30 Days</option>
                          </select>
                        </div>

                        {/* Amount Range Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Amount Range (₹)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              placeholder="Min"
                              value={minAmount}
                              onChange={(e) => setMinAmount(e.target.value)}
                              className="w-full text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={maxAmount}
                              onChange={(e) => setMaxAmount(e.target.value)}
                              className="w-full text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Batch Status Update */}
                        {canSend && (
                          <div className="pt-1.5 border-t border-border/40 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Update Status
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={targetUpdateStatus}
                                onChange={(e) => setTargetUpdateStatus(e.target.value)}
                                className="flex-1 text-[11px] rounded border border-border/60 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                              >
                                {QUOTE_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    Set to {st}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                disabled={batchBusy || !filteredQuotes.length}
                                onClick={() => void handleBatchStatusUpdate(targetUpdateStatus)}
                                className="px-2.5 py-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold transition-colors disabled:opacity-50 shrink-0"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!filteredQuotes.length ? (
                <PageState
                  icon="request_quote"
                  title="No quotations found"
                  description={
                    searchQuery
                      ? "No quotations match your search query."
                      : "The AI agent or team drafts quotes from your product catalogue when clients ask for pricing."
                  }
                  card={false}
                />
              ) : (
                <div className={selected ? styles.workspaceHasSelected : styles.workspace}>
                  {/* Quotations List Pane */}
                  <div className={`${styles.pane} ${selected ? "hidden md:flex" : "flex"}`}>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className="text-left">Quotation</th>
                            <th className="text-left">Recipient</th>
                            <th className="text-left">Total (incl. GST)</th>
                            <th className="text-left">Status</th>
                            <th className="text-left hidden lg:table-cell">Created</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedQuotes.map((q) => {
                            const recipientInitial = (q.recipient_name?.[0] || q.recipient_email?.[0] || "?").toUpperCase();
                            return (
                              <tr
                                key={q.id}
                                className={selectedId === q.id ? styles.rowActive : styles.row}
                                onClick={() => setSelectedId(q.id)}
                              >
                                {/* Quotation title + id chip */}
                                <td className="text-left">
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-foreground text-sm leading-snug truncate max-w-[210px]">{q.title}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      <span className="bg-muted px-1.5 py-px rounded text-foreground/70">#{q.id.slice(0, 8)}</span>
                                    </span>
                                  </div>
                                </td>

                                {/* Recipient with initials avatar */}
                                <td className="text-left">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#E2F6F9] text-[#0A1A2F] border border-[#8CE2EE] flex items-center justify-center font-extrabold text-xs shrink-0">
                                      {recipientInitial}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-medium text-foreground block text-xs truncate max-w-[130px]">{q.recipient_name || "No name"}</span>
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[130px] block">{q.recipient_email || q.recipient_phone || "—"}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Total */}
                                <td className="text-left whitespace-nowrap">
                                  <span className="font-bold text-foreground text-sm tracking-tight">{inr(Number(q.total_with_gst))}</span>
                                </td>

                                {/* Status badge */}
                                <td className="text-left">
                                  <span className={badgeFor(q.status) || styles.badgeOther}>
                                    {q.status === "viewed" ? (
                                      <>
                                        <Eye className="w-3 h-3" /> Viewed
                                      </>
                                    ) : (
                                      q.status
                                    )}
                                  </span>
                                </td>

                                {/* Date */}
                                <td className="text-left hidden lg:table-cell">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{dateTime(q.created_at)}</span>
                                </td>

                                {/* Actions */}
                                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <Link href={`/quotes/${q.id}`}>
                                      <button
                                        type="button"
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Open Builder"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                    </Link>
                                    {selectedId === q.id && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedId(null);
                                          setSelected(null);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Close View"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer Pagination Controls */}
                    {filteredQuotes.length > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-white text-xs text-muted-foreground shrink-0 flex-wrap gap-2">
                        {/* Custom Rows Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">Rows:</span>
                          <div className="relative shrink-0" ref={pageSizeDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                              className="h-[28px] px-2.5 bg-white border-[1.5px] border-[#03A8CB] rounded-full text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#E2F6F9]/40 hover:border-[#0284A6] transition-all duration-200 select-none"
                            >
                              <span>{pageSize}</span>
                              <ChevronDown
                                size={12}
                                className={`text-foreground transition-transform duration-150 ${pageSizeDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {pageSizeDropdownOpen && (
                              <div className="absolute bottom-[calc(100%+4px)] left-0 z-50 min-w-[90px] bg-card border border-border rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                                {[5, 10, 15, 20, 25, 50].map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      setPageSize(size);
                                      setCurrentPage(1);
                                      setPageSizeDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                                      pageSize === size
                                        ? "bg-[#E2F6F9] text-[#0A1A2F] font-bold"
                                        : "text-foreground hover:bg-[#E2F6F9]/60 hover:text-[#0396A6] hover:pl-4"
                                    }`}
                                  >
                                    <span>{size}</span>
                                    {pageSize === size && <Check size={12} className="text-[#0396A6]" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/80 bg-white text-[#0396A6] hover:bg-[#E2F6F9]/50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                            title="Previous Page"
                          >
                            <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
                          </button>

                          <span className="text-[11px] font-semibold text-foreground px-1 min-w-[2.5rem] text-center">
                            {currentPage} / {totalPages}
                          </span>

                          <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/80 bg-white text-[#0396A6] hover:bg-[#E2F6F9]/50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                            title="Next Page"
                          >
                            <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quotation Detail Right Pane */}
                  {selected ? (
                    <div className={styles.detail}>
                      {/* Sticky Detail Header */}
                      <div className={styles.detailHeader}>
                        {/* Mobile Back Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(null);
                            setSelected(null);
                          }}
                          className="md:hidden flex items-center gap-1 text-xs font-semibold text-primary mb-2 hover:underline cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back to all quotations
                        </button>

                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-foreground tracking-tight truncate">{selected.title}</h3>
                              <span className={badgeFor(selected.status) || styles.badgeOther}>
                                {selected.status === "viewed" ? (
                                  <>
                                    <Eye className="w-3 h-3" /> Viewed
                                  </>
                                ) : (
                                  selected.status
                                )}
                              </span>
                            </div>
                            {selected.viewed_at && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Opened {dateTime(selected.viewed_at)} — strong buying signal
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                              <span className="bg-muted/70 px-1.5 py-0.5 rounded border border-border/50 font-semibold text-foreground/80">
                                #{selected.id.slice(0, 8)}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyQuoteId(selected.id)}
                                className="hover:text-foreground text-muted-foreground p-0.5 rounded transition-colors"
                                title="Copy Quote Token ID"
                              >
                                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Link href={`/quotes/${selected.id}`}>
                              <Button type="button" size="sm" className="text-xs font-semibold shadow-xs h-8 px-3">
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                Open Builder
                              </Button>
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(null);
                                setSelected(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Close Detail View"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Independently Scrollable Detail Body */}
                      <div className={styles.detailBody}>
                        {/* Structured Metadata Badges Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Recipient */}
                          <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Recipient</span>
                              <span className="font-semibold text-foreground truncate block text-xs">
                                {selected.recipient_name || "No recipient name"}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate block">
                                {selected.recipient_email || selected.recipient_phone || "No contact info"}
                              </span>
                            </div>

                          {/* Created Date */}
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Created Date</span>
                              <span className="font-semibold text-foreground block text-xs">
                                {dateTime(selected.created_at)}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                Line items loaded
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Status Control Bar */}
                        {canSend && (
                          <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Status Workflow
                              </span>
                              <span className="text-[11px] text-muted-foreground font-medium">
                                Current:{" "}
                                <strong className="capitalize text-foreground">{selected.status}</strong>
                              </span>
                            </div>

                            {selected.status === "accepted" || selected.status === "rejected" ? (
                              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                Finalized: Locked for accounting compliance.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {(selected.can_approve || selected.pending_approval) && (
                                    <button
                                      type="button"
                                      onClick={() => void handleApproveQuotation(selected)}
                                      disabled={busy}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Approve & Send
                                    </button>
                                  )}
                                  {["sent", "viewed", "draft", "expired", "revised"].includes(selected.status) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleMarkOutcome(selected, "accepted")}
                                        disabled={busy}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                                      >
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        Mark Accepted (Won)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleMarkOutcome(selected, "rejected")}
                                        disabled={busy}
                                        className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        Mark Rejected (Lost)
                                      </button>
                                    </>
                                  )}
                                  {selected.status !== "revised" && (
                                    <button
                                      type="button"
                                      onClick={() => void handleReviseQuotation(selected)}
                                      disabled={busy}
                                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                                    >
                                      <RotateCw className="w-3.5 h-3.5" />
                                      Create Revision
                                    </button>
                                  )}
                                </div>

                                <div className="relative flex-1" ref={detailStatusDropdownRef}>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setDetailStatusDropdownOpen(!detailStatusDropdownOpen)}
                                    className="w-full h-[34px] px-3 bg-white border-[1.5px] border-[#03A8CB] rounded-xl text-xs font-bold text-foreground flex items-center justify-between cursor-pointer shadow-2xs hover:bg-[#E2F6F9]/40 hover:border-[#0284A6] transition-all duration-200 select-none disabled:opacity-50"
                                  >
                                    <span className="capitalize">Set Status: {selected.status}</span>
                                    <ChevronDown
                                      size={13}
                                      className={`text-foreground transition-transform duration-150 ${detailStatusDropdownOpen ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                  {detailStatusDropdownOpen && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                                      {QUOTE_STATUSES.map((st) => (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => {
                                            void handleStatusChange(selected, st);
                                            setDetailStatusDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                                            selected.status === st
                                              ? "bg-[#E2F6F9] text-[#0A1A2F] font-bold"
                                              : "text-foreground hover:bg-[#E2F6F9]/60 hover:text-[#0396A6] hover:pl-4"
                                          }`}
                                        >
                                          <span className="capitalize">{st}</span>
                                          {selected.status === st && <Check size={13} className="text-[#0396A6]" />}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Follow-up drip visibility */}
                        {selected.followup && selected.followup.status !== "none" && (
                          <div className="p-3 rounded-xl bg-card border border-border/60 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Quote Follow-up
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                                  selected.followup.status === "active"
                                    ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
                                    : selected.followup.status === "paused"
                                      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                      : selected.followup.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                        : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {selected.followup.status}
                              </span>
                            </div>
                            {selected.followup.status === "active" && selected.followup.next_scheduled_at && (
                              <p className="text-[11px] text-muted-foreground">
                                Next nudge (step {selected.followup.next_step ?? "—"}):{" "}
                                <span className="font-medium text-foreground">
                                  {dateTime(selected.followup.next_scheduled_at)}
                                </span>
                              </p>
                            )}
                            {selected.followup_opt_out && (
                              <p className="text-[11px] text-amber-700 font-medium">Customer opted out of quote follow-ups.</p>
                            )}
                            {(selected.followup.recent_deliveries?.length ?? 0) > 0 && (
                              <ul className="space-y-1 max-h-28 overflow-y-auto">
                                {selected.followup.recent_deliveries!.slice(0, 5).map((d) => (
                                  <li
                                    key={d.id}
                                    className="text-[11px] flex items-center justify-between gap-2 text-muted-foreground"
                                  >
                                    <span>
                                      Step {d.sequence_step} · {d.channel}
                                    </span>
                                    <span className="capitalize font-medium text-foreground">{d.status}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {selected.followup.status === "paused" && !selected.followup_opt_out && !["accepted", "rejected", "expired", "revised"].includes(selected.status) && (
                              <div className="pt-1 border-t border-border/40">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => void handleResumeFollowup(selected.id)}
                                  className="w-full text-xs h-7 text-sky-700 border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Resume Follow-up Drip
                                </Button>
                              </div>
                            )}
                            {selected.followup.status === "active" && (
                              <div className="pt-1 border-t border-border/40">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => void handlePauseFollowup(selected.id)}
                                  className="w-full text-xs h-7 text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                >
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pause Follow-up Drip
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Line Items ─────────────────────────────── */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Line Items
                          </h4>

                          {selected.items?.length ? (
                            <ul className={styles.lines}>
                              {selected.items.map((li) => (
                                <li key={li.id}>
                                  <span className="font-medium text-foreground text-xs">{li.description || "Item"}</span>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap text-right">
                                    {li.quantity} × {inr(Number(li.unit_price))}
                                    {" = "}
                                    <strong className="text-foreground font-semibold">{inr(Number(li.line_total))}</strong>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-2.5 px-3 border border-dashed border-border rounded-lg text-center">
                              No line items yet — click <strong>Open Builder</strong> to add products.
                            </p>
                          )}
                        </div>

                        {/* ── Pricing Totals ─────────────────────────── */}
                        <div className={styles.totalsBlock}>
                          <div className={styles.totalsRow}>
                            <span>Subtotal</span>
                            <span className="font-medium text-foreground">{inr(Number(selected.amount))}</span>
                          </div>
                          <div className={styles.totalsRow}>
                            <span>GST ({selected.gst_rate}%)</span>
                            <span className="font-medium text-foreground">{inr(Number(selected.gst_amount))}</span>
                          </div>
                          <div className={styles.totalsRow}>
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-primary" />
                              Grand Total (incl. GST)
                            </span>
                            <span className="text-primary">{inr(Number(selected.total_with_gst))}</span>
                          </div>
                        </div>

                        {/* ── Action Bar ─────────────────────────────── */}
                        {canSend ? (
                          <div className="grid grid-cols-2 gap-2 pt-1 w-full">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => void generatePdf(selected)}
                              className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9"
                            >
                              {selected.pdf_file_object_id ? (
                                <RotateCw className="w-3.5 h-3.5 mr-1.5 text-[#03A8CB]" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 mr-1.5 text-[#03A8CB]" />
                              )}
                              {selected.pdf_file_object_id ? "Regenerate PDF" : "Generate PDF"}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy || !selected.pdf_file_object_id}
                              onClick={() => void downloadPdf(selected)}
                              className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9 disabled:opacity-40"
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Download PDF
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              disabled={busy || !selected.recipient_email}
                              onClick={() => void send(selected)}
                              className="w-full justify-center text-xs font-semibold shadow-xs h-9 bg-[#03A8CB] hover:bg-[#0284A6] text-white"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Send via Email
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyShareLink(selected)}
                              className="w-full justify-center text-xs font-semibold border border-border/80 hover:bg-muted h-9"
                            >
                              {copiedLink ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                              {copiedLink ? "Copied!" : "Copy Link"}
                            </Button>
                          </div>
                        ) : (
                          <p className={styles.hint}>
                            Read-only — sending requires the <code>quotations:send</code> permission.
                          </p>
                        )}

                        {/* ── Delivery History ───────────────────────────── */}
                        {deliveries.length > 0 && (
                          <div className="pt-3 border-t border-border/40 space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Send className="w-3 h-3" />
                              Delivery History
                            </h4>
                            <div className="space-y-2 text-xs">
                              {deliveries.map((del) => (
                                <div key={del.id} className="py-2 border-b border-border/30 last:border-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-semibold text-foreground truncate">{del.recipient}</span>
                                    <span className="text-[11px] text-muted-foreground capitalize">via {del.channel}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                    <span className="font-medium text-foreground capitalize">{del.status}</span>
                                    <span>
                                      {new Date(del.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : tab === "catalog" ? (
            /* Catalogue Tab */
            <div className="flex-1 flex flex-col min-h-0 md:overflow-hidden space-y-3 pb-safe">
              {/* Toolbar Capsule Bar */}
              <div className={styles.toolbarTrack}>
                {/* Left Section: Category / Status Segmented Tabs */}
                <div className={styles.filters}>
                  <button
                    type="button"
                    className={catalogStatusFilter === "all" ? styles.filterActive : styles.filter}
                    onClick={() => {
                      setCatalogStatusFilter("all");
                      setCatalogPage(1);
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={catalogStatusFilter === "active" ? styles.filterActive : styles.filter}
                    onClick={() => {
                      setCatalogStatusFilter("active");
                      setCatalogPage(1);
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={catalogStatusFilter === "inactive" ? styles.filterActive : styles.filter}
                    onClick={() => {
                      setCatalogStatusFilter("inactive");
                      setCatalogPage(1);
                    }}
                  >
                    Inactive
                  </button>
                </div>

                {/* Right Group: Search Box + Sort Control */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  {/* Search Box */}
                  <div className="flex items-center gap-1.5 bg-background rounded-full border border-border/90 hover:border-border px-2.5 py-1 text-xs shadow-2xs w-44 sm:w-56 shrink-0 transition-colors focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setCatalogPage(1);
                      }}
                      className="w-full bg-transparent border-0 text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/70 p-0"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearch("");
                          setCatalogPage(1);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Quick Sort Custom Pill Dropdown */}
                  <div className="relative shrink-0" ref={catalogSortDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCatalogSortDropdownOpen(!catalogSortDropdownOpen)}
                      className="h-[30px] px-3 bg-white border-[1.5px] border-[#03A8CB] rounded-full text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#E2F6F9]/40 hover:border-[#0284A6] hover:shadow-sm transition-all duration-200 select-none"
                    >
                      <ArrowUpDown className="w-3 h-3 text-[#03A8CB] shrink-0" />
                      <span>
                        {catalogSortField === "name" && catalogSortOrder === "asc"
                          ? "Name (A-Z)"
                          : catalogSortField === "name" && catalogSortOrder === "desc"
                          ? "Name (Z-A)"
                          : catalogSortField === "price" && catalogSortOrder === "asc"
                          ? "Price (Low-High)"
                          : catalogSortField === "price" && catalogSortOrder === "desc"
                          ? "Price (High-Low)"
                          : "Active First"}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`text-foreground transition-transform duration-150 ${catalogSortDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {catalogSortDropdownOpen && (
                      <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[150px] bg-card border border-border rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                        {[
                          { key: "name-asc", label: "Name (A-Z)" },
                          { key: "name-desc", label: "Name (Z-A)" },
                          { key: "price-asc", label: "Price (Low-High)" },
                          { key: "price-desc", label: "Price (High-Low)" },
                          { key: "status-desc", label: "Active First" },
                        ].map((opt) => {
                          const active = `${catalogSortField}-${catalogSortOrder}` === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                const [field, order] = opt.key.split("-") as [any, any];
                                setCatalogSortField(field);
                                setCatalogSortOrder(order);
                                setCatalogSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                                active
                                  ? "bg-[#E2F6F9] text-[#0A1A2F] font-bold"
                                  : "text-foreground hover:bg-[#E2F6F9]/60 hover:text-[#0396A6] hover:pl-4"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {active && <Check size={12} className="text-[#0396A6]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {canCatalogWrite && (
                    <Button
                      type="button"
                      onClick={() => setCreateProductOpen(true)}
                      className="h-[30px] rounded-full text-xs font-semibold px-3 shadow-xs flex items-center gap-1 bg-[#03A8CB] hover:bg-[#0284A6] text-white shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Table Card */}
              {!products.length || (catalogStatusFilter !== "inactive" && catalogActiveCount === 0) ? (
                <PageState
                  icon="inventory_2"
                  title="Your catalogue is empty"
                  description={
                    products.length && catalogActiveCount === 0
                      ? "All catalogue items are inactive. Switch to the Inactive tab to view or restore them, or add a new product."
                      : "Add products to your catalogue so your AI agents and sales team can generate accurate proposals with instant pricing."
                  }
                  action={
                    canCatalogWrite ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {products.length && catalogActiveCount === 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setCatalogStatusFilter("inactive")}
                            className="text-xs font-semibold"
                          >
                            View inactive products
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          onClick={() => setCreateProductOpen(true)}
                          className="text-xs font-semibold shadow-md"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Add Catalogue Item
                        </Button>
                      </div>
                    ) : products.length && catalogActiveCount === 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCatalogStatusFilter("inactive")}
                        className="text-xs font-semibold"
                      >
                        View inactive products
                      </Button>
                    ) : undefined
                  }
                />
              ) : !filteredAndSortedProducts.length ? (
                catalogHasSearchFilter ? (
                  <PageState
                    icon="search_off"
                    title="No matching products found"
                    description={`No catalogue items matched "${catalogSearch.trim()}". Try searching with a different keyword.`}
                    action={
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setCatalogSearch("");
                          setCatalogPage(1);
                        }}
                        className="text-xs font-semibold"
                      >
                        Clear search
                      </Button>
                    }
                  />
                ) : catalogStatusFilter === "inactive" ? (
                  <PageState
                    icon="inventory_2"
                    title="No inactive products"
                    description="You don't have any deactivated catalogue items. Deleted or deactivated products will appear here."
                    action={
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCatalogStatusFilter("all")}
                        className="text-xs font-semibold"
                      >
                        View active products
                      </Button>
                    }
                  />
                ) : null
              ) : (
                <div className="rounded-xl border border-border/80 bg-white shadow-xs overflow-hidden flex flex-col md:flex-1 md:min-h-0">
                  <div className="overflow-x-auto md:overflow-y-auto md:flex-1 md:min-h-0 no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/70 bg-white text-[11px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
                          <th className="py-3 px-4">Product & Details</th>
                          <th className="py-3 px-4">Unit Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {paginatedCatalogProducts.map((p) => {
                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-muted/30 transition-colors group"
                            >
                              {/* Product Info */}
                              <td className="py-3.5 px-4">
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground font-normal">
                                      #{p.id.slice(0, 6)}
                                    </span>
                                  </div>
                                  {p.description ? (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                                      {p.description}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-muted-foreground/50 italic mt-0.5">
                                      No description provided
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Unit Price */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground text-sm tracking-tight">
                                    {inr(Number(p.unit_price || 0))}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    Base rate
                                  </span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="text-xs font-semibold text-foreground capitalize">
                                  {p.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                {canCatalogWrite ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditProduct(p)}
                                      className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-[#03A8CB] hover:bg-[#E2F6F9]/40 transition-colors"
                                      title="Edit item details"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                                      Edit
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => {
                                        if (p.is_active) {
                                          setDeactivateProductTarget(p);
                                        } else {
                                          void toggleProductActive(p);
                                        }
                                      }}
                                      className={`h-7 px-2 text-xs font-medium transition-colors ${
                                        p.is_active
                                          ? "text-muted-foreground hover:text-[#03A8CB] hover:bg-[#E2F6F9]/40"
                                          : "text-muted-foreground hover:text-[#03A8CB] hover:bg-[#E2F6F9]/40"
                                      }`}
                                      title={p.is_active ? "Deactivate item" : "Activate item"}
                                    >
                                      {p.is_active ? "Deactivate" : "Activate"}
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => setDeleteProductTarget(p)}
                                      className="h-7 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination & Summary Footer */}
                  {filteredAndSortedProducts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-2">
                        <span>
                          Showing{" "}
                          <strong className="text-foreground">
                            {Math.min((catalogPage - 1) * catalogPageSize + 1, filteredAndSortedProducts.length)}
                          </strong>{" "}
                          to{" "}
                          <strong className="text-foreground">
                            {Math.min(catalogPage * catalogPageSize, filteredAndSortedProducts.length)}
                          </strong>{" "}
                          of <strong className="text-foreground">{filteredAndSortedProducts.length}</strong> products
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">Rows:</span>
                          <div className="relative shrink-0" ref={catalogPageSizeDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setCatalogPageSizeDropdownOpen(!catalogPageSizeDropdownOpen)}
                              className="h-[28px] px-2.5 bg-white border-[1.5px] border-[#03A8CB] rounded-full text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#E2F6F9]/40 hover:border-[#0284A6] transition-all duration-200 select-none"
                            >
                              <span>{catalogPageSize}</span>
                              <ChevronDown
                                size={12}
                                className={`text-foreground transition-transform duration-150 ${catalogPageSizeDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {catalogPageSizeDropdownOpen && (
                              <div className="absolute bottom-[calc(100%+4px)] left-0 z-50 min-w-[90px] bg-white border border-border rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                                {[5, 10, 20, 50].map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      setCatalogPageSize(size);
                                      setCatalogPage(1);
                                      setCatalogPageSizeDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                                      catalogPageSize === size
                                        ? "bg-[#E2F6F9] text-[#0A1A2F] font-bold"
                                        : "text-foreground hover:bg-[#E2F6F9]/60 hover:text-[#0396A6] hover:pl-4"
                                    }`}
                                  >
                                    <span>{size}</span>
                                    {catalogPageSize === size && <Check size={12} className="text-[#0396A6]" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={catalogPage <= 1}
                            onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/80 bg-white text-[#0396A6] hover:bg-[#E2F6F9]/50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                            aria-label="Previous Page"
                          >
                            <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                          <span className="text-xs font-semibold px-1 min-w-[2.5rem] text-center text-foreground">
                            {catalogPage} / {catalogTotalPages}
                          </span>
                          <button
                            type="button"
                            disabled={catalogPage >= catalogTotalPages}
                            onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/80 bg-white text-[#0396A6] hover:bg-[#E2F6F9]/50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                            aria-label="Next Page"
                          >
                            <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar">
              <TemplatesTab ref={templatesTabRef} merchant={merchant} canEdit={canSend} />
            </div>
          )}
        </div>

        {/* Modal: Create New Quotation */}
        <Modal
          open={createQuoteOpen}
          onOpenChange={setCreateQuoteOpen}
          title="Create New Quotation"
          description="Draft a custom quotation for a customer with items from your catalogue."
          width="lg"
        >
          <form onSubmit={(e) => void handleCreateQuotationSubmit(e)} className="space-y-4">
            <Field
              label="Quotation Title"
              name="title"
              value={qTitle}
              onChange={setQTitle}
              placeholder="e.g. Enterprise Sales Suite & Custom Implementation"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label="Recipient Name"
                name="recipient_name"
                value={qRecipientName}
                onChange={setQRecipientName}
                placeholder="John Doe"
              />
              <Field
                label="Recipient Email"
                name="recipient_email"
                type="email"
                value={qRecipientEmail}
                onChange={setQRecipientEmail}
                placeholder="john@company.com"
              />
              <Field
                label="Recipient Phone"
                name="recipient_phone"
                value={qRecipientPhone}
                onChange={setQRecipientPhone}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold text-foreground flex-1">
                <span>GST Rate (%)</span>
                <select
                  value={qGstRate}
                  onChange={(e) => setQGstRate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="0">0% (Zero Rated)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </label>
            </div>

            {/* Line Items Picker */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  Catalogue Line Items ({qLineItems.length})
                </h4>
                {qLineItems.length > 0 && (
                  <span className="text-xs font-semibold text-primary">
                    {inr(qLineItems.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0), 0))} subtotal
                  </span>
                )}
              </div>

              {products.length > 0 ? (
                <div className="flex items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-foreground flex-1">
                    <span>Select Product</span>
                    <select
                      value={selectedProdForQuote}
                      onChange={(e) => setSelectedProdForQuote(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name} — {inr(Number(pr.unit_price))}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="w-20">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-foreground">
                      <span>Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={quoteProdQty}
                        onChange={(e) => setQuoteProdQty(e.target.value)}
                        className="px-2.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center font-bold"
                      />
                    </label>
                  </div>

                  <Button type="button" variant="ghost" onClick={handleAddLineToDraft} className="text-xs font-semibold shrink-0">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-amber-600">No products in catalogue. Add products first to build quotes.</p>
              )}

              {/* Added Line Items List */}
              {qLineItems.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  {qLineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="font-semibold text-foreground truncate block">{item.description}</strong>
                        <span className="text-[11px] text-muted-foreground">
                          {item.quantity} × {inr(Number(item.unit_price))}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <strong className="font-bold text-foreground">
                          {inr(Number(item.quantity) * Number(item.unit_price))}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineFromDraft(idx)}
                          className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Live Draft Summary Total */}
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-semibold text-foreground">
                        {inr(qLineItems.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST ({qGstRate}%)</span>
                      <span className="font-semibold text-foreground">
                        {inr((qLineItems.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) * Number(qGstRate || 0)) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-primary/20">
                      <span>Estimated Grand Total</span>
                      <span className="text-primary">
                        {inr(
                          qLineItems.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) *
                            (1 + Number(qGstRate || 0) / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} disabled={!qTitle.trim() || qLineItems.length === 0}>
                Create Quotation
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Create Catalogue Product */}
        <Modal
          open={createProductOpen}
          onOpenChange={(open) => {
            setCreateProductOpen(open);
            if (!open) {
              setPNameTouched(false);
              setPPriceTouched(false);
              setPFormError(null);
            }
          }}
          title="Add Catalogue Item"
          description="Add a new product or service that your AI agent is authorized to quote."
        >
          <form onSubmit={(e) => void addProduct(e)} className="space-y-4">
            {pFormError && (
              <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{pFormError}</span>
              </div>
            )}

            {/* Product Name Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Product / Service Name <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{pName.trim().length}/100</span>
              </div>
              <input
                type="text"
                value={pName}
                onChange={(e) => {
                  setPName(e.target.value);
                  if (pFormError) setPFormError(null);
                }}
                onBlur={() => setPNameTouched(true)}
                placeholder="e.g. Enterprise AI Suite Monthly Plan"
                className={`w-full text-xs rounded-xl border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all ${
                  pNameTouched && validateProdName(pName)
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                }`}
              />
              {pNameTouched && validateProdName(pName) && (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
                  <span>•</span> {validateProdName(pName)}
                </p>
              )}
            </div>

            {/* Unit Price Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Unit Base Price (₹) <span className="text-red-500">*</span>
                </label>
                {pPrice && !validateProdPrice(pPrice) && (
                  <span className="text-[11px] font-bold text-primary">
                    Preview: {inr(Number(pPrice))}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="text"
                  value={pPrice}
                  onChange={(e) => {
                    setPPrice(e.target.value);
                    if (pFormError) setPFormError(null);
                  }}
                  onBlur={() => setPPriceTouched(true)}
                  placeholder="e.g. 49999.00"
                  className={`w-full text-xs rounded-xl border bg-background pl-7 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none font-semibold transition-all ${
                    pPriceTouched && validateProdPrice(pPrice)
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                  }`}
                />
              </div>
              {pPriceTouched && validateProdPrice(pPrice) ? (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
                  <span>•</span> {validateProdPrice(pPrice)}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Enter positive numeric amount (up to 2 decimal places, e.g. 1499.50)
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Description <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{pDesc.length}/500</span>
              </div>
              <textarea
                rows={3}
                value={pDesc}
                onChange={(e) => {
                  setPDesc(e.target.value);
                  if (pFormError) setPFormError(null);
                }}
                placeholder="Brief summary of inclusions, specifications, or deliverables..."
                className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
              />
              {pDesc.length > 500 && (
                <p className="text-[11px] font-medium text-red-500">
                  Description cannot exceed 500 characters.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateProductOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={busy}
                disabled={Boolean(validateProdName(pName) || validateProdPrice(pPrice) || validateProdDesc(pDesc))}
              >
                Add Product
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Catalogue Product */}
        <Modal
          open={editProductOpen}
          onOpenChange={(open) => {
            setEditProductOpen(open);
            if (!open) {
              setEditProdNameTouched(false);
              setEditProdPriceTouched(false);
              setEditProdFormError(null);
            }
          }}
          title="Edit Catalogue Item"
          description="Update pricing and details for this product in your catalogue."
          width="md"
        >
          <form onSubmit={(e) => void handleEditProductSubmit(e)} className="space-y-4">
            {editProdFormError && (
              <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{editProdFormError}</span>
              </div>
            )}

            {/* Product Name Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Product / Service Name <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{editProdName.trim().length}/100</span>
              </div>
              <input
                type="text"
                value={editProdName}
                onChange={(e) => {
                  setEditProdName(e.target.value);
                  if (editProdFormError) setEditProdFormError(null);
                }}
                onBlur={() => setEditProdNameTouched(true)}
                placeholder="e.g. Standard Support Plan"
                className={`w-full text-xs rounded-xl border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none transition-all ${
                  editProdNameTouched && validateProdName(editProdName)
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                }`}
              />
              {editProdNameTouched && validateProdName(editProdName) && (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
                  <span>•</span> {validateProdName(editProdName)}
                </p>
              )}
            </div>

            {/* Unit Price Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Unit Base Price (₹) <span className="text-red-500">*</span>
                </label>
                {editProdPrice && !validateProdPrice(editProdPrice) && (
                  <span className="text-[11px] font-bold text-primary">
                    Preview: {inr(Number(editProdPrice))}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="text"
                  value={editProdPrice}
                  onChange={(e) => {
                    setEditProdPrice(e.target.value);
                    if (editProdFormError) setEditProdFormError(null);
                  }}
                  onBlur={() => setEditProdPriceTouched(true)}
                  placeholder="e.g. 49999.00"
                  className={`w-full text-xs rounded-xl border bg-background pl-7 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none font-semibold transition-all ${
                    editProdPriceTouched && validateProdPrice(editProdPrice)
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                  }`}
                />
              </div>
              {editProdPriceTouched && validateProdPrice(editProdPrice) ? (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
                  <span>•</span> {validateProdPrice(editProdPrice)}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Enter positive numeric amount (up to 2 decimal places, e.g. 1499.50)
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Description <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{editProdDesc.length}/500</span>
              </div>
              <textarea
                rows={3}
                value={editProdDesc}
                onChange={(e) => {
                  setEditProdDesc(e.target.value);
                  if (editProdFormError) setEditProdFormError(null);
                }}
                placeholder="Brief summary of inclusions, specifications, or deliverables..."
                className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
              />
              {editProdDesc.length > 500 && (
                <p className="text-[11px] font-medium text-red-500">
                  Description cannot exceed 500 characters.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditProductOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={busy}
                disabled={Boolean(validateProdName(editProdName) || validateProdPrice(editProdPrice) || validateProdDesc(editProdDesc))}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Modal: Deactivate Catalogue Item */}
        <ConfirmModal
          isOpen={Boolean(deactivateProductTarget)}
          title="Deactivate Catalogue Item"
          message={`Are you sure you want to deactivate "${deactivateProductTarget?.name}"? Inactive items will not be suggested by AI agents or available for new quotations.`}
          tone="warning"
          confirmText="Deactivate Item"
          cancelText="Cancel"
          onConfirm={async () => {
            if (deactivateProductTarget) {
              const target = deactivateProductTarget;
              setDeactivateProductTarget(null);
              await toggleProductActive(target);
            }
          }}
          onClose={() => setDeactivateProductTarget(null)}
        />

        {/* Confirm Modal: Delete Catalogue Item */}
        <ConfirmModal
          isOpen={Boolean(deleteProductTarget)}
          title="Delete Catalogue Item"
          message={`Are you sure you want to delete "${deleteProductTarget?.name}" from your catalogue? This item will be permanently removed.`}
          tone="danger"
          confirmText="Delete Product"
          cancelText="Cancel"
          onConfirm={async () => {
            if (deleteProductTarget) {
              const target = deleteProductTarget;
              setDeleteProductTarget(null);
              await deleteProduct(target);
            }
          }}
          onClose={() => setDeleteProductTarget(null)}
        />
      </EntitlementGate>
    </AppShell>
  );
}

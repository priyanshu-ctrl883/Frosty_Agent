"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PageState } from "@/components/ui/PageState";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api";
import {
  RaiseTicketButton,
  CreateTicketModal,
  MerchantTicketDetailDrawer,
  TicketNotificationCenter,
  TicketCreatedResponse,
} from "@/components/tickets";

import {
  LifeBuoy,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Tag,
  Calendar,
} from "lucide-react";

function TicketsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<TicketCreatedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Selected ticket for detail drawer from URL or state
  const selectedTicketId = searchParams.get("ticketId") || searchParams.get("id") || null;
  const defaultSubject = searchParams.get("subject") || "";
  const defaultRelatedResource = searchParams.get("related_resource") || searchParams.get("resource") || "";
  const defaultCategory = (searchParams.get("category") || "Technical / Agent") as any;

  useEffect(() => {
    if (searchParams.get("create") === "true" || searchParams.get("raise") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const fetchTickets = useCallback(async (isRefresh = false) => {

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await apiRequest<TicketCreatedResponse[]>("/v1/merchant/tickets");
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenTicket = (ticketId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ticketId", ticketId);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  const handleCloseDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ticketId");
    params.delete("id");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  const handleTicketUpdated = (updated: TicketCreatedResponse) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
    );
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return {
          bg: "rgba(255, 122, 94, 0.12)",
          color: "rgb(255, 122, 94)",
          border: "rgba(255, 122, 94, 0.3)",
        };
      case "high":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "#d97706",
          border: "rgba(245, 158, 11, 0.3)",
        };
      case "low":
        return {
          bg: "#f1f5f9",
          color: "#64748b",
          border: "#cbd5e1",
        };
      default:
        return {
          bg: "rgba(3, 150, 166, 0.1)",
          color: "#0396A6",
          border: "rgba(3, 150, 166, 0.3)",
        };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed":
        return {
          bg: "#ecfdf5",
          color: "#059669",
          icon: <CheckCircle className="w-3.5 h-3.5" />,
        };
      case "in progress":
        return {
          bg: "#eff6ff",
          color: "#2563eb",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "waiting on merchant":
        return {
          bg: "rgba(255, 122, 94, 0.1)",
          color: "rgb(220, 70, 40)",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: "rgba(3, 150, 166, 0.1)",
          color: "#0396A6",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <AppShell
      title="Support Tickets"
      subtitle="Report issues, request features, and get assistance from engineering support."
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TicketNotificationCenter
            onSelectTicket={(ticketId) => {
              router.push(`${pathname}?ticketId=${ticketId}`);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchTickets(true)}
            disabled={refreshing || loading}
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <RaiseTicketButton
            label="Raise Ticket"
            size="sm"
            onTicketCreated={() => fetchTickets(true)}
          />
        </div>
      }

      requires="dashboard:view"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Feature Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(3, 150, 166, 0.08) 0%, rgba(255, 122, 94, 0.06) 100%)",
            border: "1px solid rgba(3, 150, 166, 0.15)",
            borderRadius: "12px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid rgba(3, 150, 166, 0.2)",
                color: "#0396A6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(3, 150, 166, 0.08)",
              }}
            >
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Need help with your workspace or agent?
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "3px 0 0" }}>
                Our team monitors support requests with guaranteed response times based on priority.
              </p>
            </div>
          </div>

          <RaiseTicketButton
            label="Raise Ticket"
            size="md"
            onTicketCreated={() => fetchTickets(true)}
          />
        </div>

        {/* Tickets Listing Section */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "2px solid #0396A6",
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : tickets.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "48px 24px",
            }}
          >
            <PageState
              icon="help_center"
              title="No tickets raised yet"
              description="Have a question or running into an issue? Raise a support ticket and our team will get right on it."
              action={
                <RaiseTicketButton
                  label="Raise Your First Ticket"
                  size="md"
                  onTicketCreated={() => fetchTickets(true)}
                />
              }
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tickets.map((ticket) => {
              const priorityStyle = getPriorityStyle(ticket.priority);
              const statusStyle = getStatusStyle(ticket.status);

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleOpenTicket(ticket.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0396A6";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(3, 150, 166, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: "#0396A6",
                          background: "rgba(3, 150, 166, 0.08)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {ticket.ticket_number}
                      </span>
                      <h4
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        {ticket.subject}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {/* Status Badge */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.icon}
                        {ticket.status}
                      </span>

                      {/* Priority Badge */}
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.border}`,
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#475569",
                      margin: 0,
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {ticket.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      fontSize: "12px",
                      color: "#94a3b8",
                      paddingTop: "6px",
                      borderTop: "1px solid #f8fafc",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Tag className="w-3.5 h-3.5" />
                      {ticket.category}
                    </span>

                    {ticket.related_resource && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FileText className="w-3.5 h-3.5" />
                        {ticket.related_resource}
                      </span>
                    )}

                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ticket.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateTicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultSubject={defaultSubject}
        defaultCategory={defaultCategory}
        defaultRelatedResource={defaultRelatedResource}
        onTicketCreated={() => fetchTickets(true)}
      />


      <MerchantTicketDetailDrawer
        ticketId={selectedTicketId}
        onClose={handleCloseDrawer}
        onTicketUpdated={handleTicketUpdated}
      />
    </AppShell>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading tickets...</div>}>
      <TicketsContent />
    </Suspense>
  );
}

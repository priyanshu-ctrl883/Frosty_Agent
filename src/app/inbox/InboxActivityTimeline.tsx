"use client";

import { formatActivityTime, relative } from "@/lib/format";
import type { TimelineEvent } from "@/lib/conversations";
import {
  Zap,
  User,
  MessageSquare,
  Bot,
  Target,
  Calendar,
  FileText,
  Settings,
  Globe,
  Pin,
  Clock,
  RotateCw,
} from "lucide-react";

type Props = {
  events: TimelineEvent[];
  loading: boolean;
  onRefresh?: () => void;
};

function getEventMeta(kind: string, label: string | null) {
  switch (kind) {
    case "handoff":
      return {
        icon: <Zap size={11} />,
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#d97706",
        title: label ? `Handoff: ${label}` : "Handoff Event",
      };
    case "message":
      if (label === "Customer" || label === "user") {
        return {
          icon: <User size={11} />,
          bg: "rgba(59, 130, 246, 0.1)",
          color: "#2563eb",
          title: "Customer Message",
        };
      }
      if (label === "Teammate" || label === "agent") {
        return {
          icon: <MessageSquare size={11} />,
          bg: "rgba(16, 185, 129, 0.12)",
          color: "#059669",
          title: "Teammate Replied",
        };
      }
      return {
        icon: <Bot size={11} />,
        bg: "rgba(3, 150, 166, 0.12)",
        color: "#0396a6",
        title: "AI Response",
      };
    case "lead":
      return {
        icon: <Target size={11} />,
        bg: "rgba(168, 85, 247, 0.12)",
        color: "#9333ea",
        title: label ? `Lead Event (${label})` : "Lead Event",
      };
    case "meeting":
      return {
        icon: <Calendar size={11} />,
        bg: "rgba(14, 165, 233, 0.12)",
        color: "#0284c7",
        title: label ? `Meeting: ${label}` : "Meeting Scheduled",
      };
    case "quotation":
      return {
        icon: <FileText size={11} />,
        bg: "rgba(234, 88, 12, 0.12)",
        color: "#c2410c",
        title: label ? `Quotation: ${label}` : "Quotation",
      };
    case "tool":
      return {
        icon: <Settings size={11} />,
        bg: "rgba(107, 114, 128, 0.12)",
        color: "#4b5563",
        title: label ? `AI Action: ${label}` : "AI Tool Action",
      };
    case "bridge":
      return {
        icon: <Globe size={11} />,
        bg: "rgba(99, 102, 241, 0.12)",
        color: "#4f46e5",
        title: `Bridge Linked (${label || "cross-channel"})`,
      };
    default:
      return {
        icon: <Pin size={11} />,
        bg: "rgba(107, 114, 128, 0.1)",
        color: "#4b5563",
        title: label || kind,
      };
  }
}

export function InboxActivityTimeline({ events, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--lt-text-muted, #6b7280)" }}>
        <div style={{ display: "inline-block", width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #0396a6", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "8px", fontSize: "0.875rem" }}>Loading activity history...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--lt-text-muted, #6b7280)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "var(--lt-text-muted, #9ca3af)" }}>
          <Clock size={32} />
        </div>
        <h4 style={{ margin: 0, fontWeight: 600, color: "var(--lt-text-primary, #111827)" }}>No Activity Yet</h4>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
          Timeline events, AI tool executions, handoff transitions, and notes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem 1.5rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--lt-text-primary, #111827)" }}>
            Conversation Activity
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--lt-text-muted, #6b7280)" }}>
            Complete chronological event log & lifecycle transitions
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "1px solid var(--lt-border, #e5e7eb)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--lt-text-muted, #6b7280)",
              cursor: "pointer",
            }}
          >
            <RotateCw size={12} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Timeline track */}
      <div style={{ position: "relative", paddingLeft: "24px" }}>
        <div
          style={{
            position: "absolute",
            left: "9px",
            top: "12px",
            bottom: "12px",
            width: "2px",
            background: "var(--lt-border, #e5e7eb)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {events.map((evt, idx) => {
            const meta = getEventMeta(evt.kind, evt.label);

            return (
              <div
                key={`${evt.kind}-${evt.ref}-${evt.at}-${idx}`}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Node icon */}
                <div
                  style={{
                    position: "absolute",
                    left: "-24px",
                    top: "2px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: meta.bg,
                    border: "2px solid #ffffff",
                    boxShadow: "0 0 0 1px var(--lt-border, #e5e7eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    zIndex: 2,
                  }}
                >
                  {meta.icon}
                </div>

                {/* Event Content Card */}
                <div
                  style={{
                    flex: 1,
                    background: "var(--lt-card, #ffffff)",
                    border: "1px solid var(--lt-border, #e5e7eb)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--lt-text-primary, #111827)",
                        }}
                      >
                        {meta.title}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          background: meta.bg,
                          color: meta.color,
                        }}
                      >
                        {evt.kind}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--lt-text-muted, #6b7280)",
                        whiteSpace: "nowrap",
                      }}
                      title={formatActivityTime(evt.at)}
                    >
                      {relative(evt.at)}
                    </span>
                  </div>

                  {evt.detail && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "0.82rem",
                        color: "var(--lt-text-secondary, #374151)",
                        lineHeight: 1.45,
                        background: "var(--lt-surface, #f9fafb)",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid var(--lt-border, #f3f4f6)",
                      }}
                    >
                      {evt.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle,
  MessageSquare,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Clock,
  Ticket as TicketIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "./tickets.module.css";
import type { TicketNotification } from "@/lib/types";

interface MerchantTicketNotificationCenterProps {
  onSelectTicket?: (ticketId: string) => void;
}

export function TicketNotificationCenter({ onSelectTicket }: MerchantTicketNotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: { unread_count: number } }>(
        "/v1/merchant/tickets/notifications/unread-count"
      );
      if (res && res.data) {
        setUnreadCount(res.data.unread_count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch notification list
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/v1/merchant/tickets/notifications?limit=25${filterUnread ? "&unread_only=true" : ""}`;
      const res = await apiRequest<{ data: { items: TicketNotification[]; unread_count?: number } }>(url);
      if (res && res.data) {
        setNotifications(res.data.items ?? []);
        if (typeof res.data.unread_count === "number") {
          setUnreadCount(res.data.unread_count);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterUnread]);

  // Initial load and polling every 20s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (open) {
        fetchNotifications();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications, open]);

  // When panel opens or filter changes, fetch list
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Mark single notification as read
  const handleMarkAsRead = async (notif: TicketNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.read_at) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiRequest(`/v1/merchant/tickets/notifications/${notif.id}/read`, {
        method: "PATCH",
      });
    } catch {
      // ignore
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    // Optimistic UI
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await apiRequest("/v1/merchant/tickets/notifications/read-all", {
        method: "POST",
      });
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  // Click on a notification row
  const handleNotificationClick = (notif: TicketNotification) => {
    handleMarkAsRead(notif);
    setOpen(false);
    if (onSelectTicket) {
      onSelectTicket(notif.ticket_id);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("ticketId", notif.ticket_id);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "ticket_reply":
        return <MessageSquare size={14} color="#0396A6" />;
      case "ticket_assigned":
        return <UserCheck size={14} color="#0396A6" />;
      case "ticket_reassigned":
        return <UserPlus size={14} color="rgb(255, 122, 94)" />;
      case "priority_escalated":
        return <AlertTriangle size={14} color="rgb(255, 122, 94)" />;
      case "status_changed":
        return <Clock size={14} color="#0396A6" />;
      default:
        return <TicketIcon size={14} color="#0396A6" />;
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "recently";
    }
  };

  return (
    <div className={styles.notifCenterWrapper} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className={`${styles.notifBellBtn} ${open ? styles.notifBellBtnActive : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Support Notifications"
        aria-label="Support Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className={styles.notifBadge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Popover Panel */}
      {open && (
        <div className={styles.notifPopover}>
          {/* Header */}
          <div className={styles.notifPopoverHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} color="#0396A6" />
              <span className={styles.notifPopoverTitle}>Support Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.notifHeaderCount}>
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.notifMarkAllBtn}
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                className={styles.notifCloseBtn}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.notifFilterBar}>
            <button
              type="button"
              className={`${styles.notifFilterTab} ${!filterUnread ? styles.notifFilterTabActive : ""}`}
              onClick={() => setFilterUnread(false)}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.notifFilterTab} ${filterUnread ? styles.notifFilterTabActive : ""}`}
              onClick={() => setFilterUnread(true)}
            >
              Unread only {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          </div>

          {/* Notifications List */}
          <div className={styles.notifListBody}>
            {loading && notifications.length === 0 ? (
              <div className={styles.notifLoadingBox}>
                <RefreshCw size={18} className={styles.spinIcon} color="#0396A6" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.notifEmptyBox}>
                <CheckCircle size={24} color="#94a3b8" />
                <p className={styles.notifEmptyTitle}>No notifications</p>
                <p className={styles.notifEmptySubtitle}>
                  {filterUnread
                    ? "You're all caught up on unread notifications!"
                    : "No ticket updates from support yet."}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read_at;
                return (
                  <div
                    key={notif.id}
                    className={`${styles.notifItem} ${isUnread ? styles.notifItemUnread : ""}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={styles.notifItemIconCol}>
                      <div className={styles.notifItemIconBox}>
                        {getEventIcon(notif.event_type)}
                      </div>
                      {isUnread && <span className={styles.notifUnreadDot} />}
                    </div>

                    <div className={styles.notifItemContent}>
                      <div className={styles.notifItemTopRow}>
                        <span className={styles.notifTicketId}>
                          {notif.ticket_number || "Ticket"}
                        </span>
                        <span className={styles.notifTime}>
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className={styles.notifItemTitle}>{notif.title}</p>
                      <p className={styles.notifItemMessage}>{notif.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

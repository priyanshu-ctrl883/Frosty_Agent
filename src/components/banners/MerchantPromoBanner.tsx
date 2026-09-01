"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import {
  Megaphone,
  Tag,
  Sparkles,
  AlertTriangle,
  Flame,
  Gift,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  X,
} from "lucide-react";
import styles from "./MerchantPromoBanner.module.css";

export type BannerPlacement =
  | "top_banner"
  | "dashboard_card"
  | "modal"
  | "floating_toast"
  | "sidebar_footer"
  | "custom";

export interface ActivePromoBanner {
  id: string;
  name: string;
  title: string;
  description: string | null;
  template_id: string;
  status: string;
  placement: BannerPlacement;
  target_type: string;
  priority: number;
  dismissible: boolean;
  content: {
    cta_text?: string;
    cta_url?: string;
    secondary_cta_text?: string;
    secondary_cta_url?: string;
    coupon_code?: string;
    badge_text?: string;
    bg_color?: string;
    text_color?: string;
    icon?: string;
    highlights?: string[];
    [key: string]: unknown;
  };
  start_at: string | null;
  end_at: string | null;
}

interface MerchantPromoBannerProps {
  placement: BannerPlacement;
  className?: string;
}

export function MerchantPromoBanner({ placement, className = "" }: MerchantPromoBannerProps) {
  const { merchant } = useWorkspace();
  const [banners, setBanners] = useState<ActivePromoBanner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const recordEvent = (bannerId: string, eventType: "impression" | "click" | "dismiss") => {
    try {
      apiRequest(`/v1/merchant/banners/${bannerId}/event`, {
        method: "POST",
        body: JSON.stringify({ event_type: eventType }),
      }).catch(() => {});
    } catch {
      // fail silently
    }
  };

  // Load dismissed list from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`frosty_dismissed_banners_${merchant?.id || "global"}`);
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [merchant?.id]);

  // Fetch active banners for this placement
  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const data = await apiRequest<ActivePromoBanner[]>(
          `/v1/merchant/banners/active?placement=${placement}`,
        );
        if (isMounted && Array.isArray(data)) {
          setBanners(data);
        }
      } catch {
        // Fail silently - never break merchant dashboard
      } finally {
        if (isMounted) setLoaded(true);
      }
    };

    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, [placement, merchant?.id]);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(
        `frosty_dismissed_banners_${merchant?.id || "global"}`,
        JSON.stringify(updated),
      );
    } catch {
      // ignore
    }
    recordEvent(id, "dismiss");
  };

  // Filter out dismissed banners
  const eligibleBanners = useMemo(() => {
    return banners.filter((b) => !dismissedIds.includes(b.id));
  }, [banners, dismissedIds]);

  // Record impression once per session per banner
  const activeBanner = eligibleBanners[0];
  useEffect(() => {
    if (activeBanner?.id) {
      try {
        const key = `frosty_banner_impression_${activeBanner.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          recordEvent(activeBanner.id, "impression");
        }
      } catch {
        // ignore
      }
    }
  }, [activeBanner?.id]);

  if (!loaded || eligibleBanners.length === 0 || !activeBanner) {
    return null;
  }


  const getIcon = (name?: string) => {
    switch (name) {
      case "Tag":
        return <Tag size={16} />;
      case "Sparkles":
        return <Sparkles size={16} />;
      case "AlertTriangle":
        return <AlertTriangle size={16} />;
      case "Flame":
        return <Flame size={16} />;
      case "Gift":
        return <Gift size={16} />;
      case "ShieldCheck":
        return <ShieldCheck size={16} />;
      case "HelpCircle":
        return <HelpCircle size={16} />;
      default:
        return <Megaphone size={16} />;
    }
  };

  const { content, dismissible, title, description, template_id, id } = activeBanner;
  const bgColor = content?.bg_color || (template_id === "urgent_alert" ? "#fed7aa" : "#0396A6");
  const textColor = content?.text_color || (template_id === "urgent_alert" ? "#9a3412" : "#ffffff");
  const icon = content?.icon;
  const ctaText = content?.cta_text || "Learn More";
  const ctaUrl = content?.cta_url || "#";
  const isExternal = ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://");
  const badgeText = content?.badge_text;
  const couponCode = content?.coupon_code;

  // 1. TOP BANNER PLACEMENT
  if (placement === "top_banner") {
    return (
      <div
        className={`${styles.topBannerWrap} ${className}`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
        }}
        role="region"
        aria-label="Promotional announcement"
      >
        <div className={styles.topBannerInner}>
          <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {getIcon(icon)}
          </span>
          <div className={styles.topBannerTextWrap}>
            {badgeText && <span className={styles.badgePill}>{badgeText}</span>}
            <strong style={{ fontSize: "13px" }}>{title}</strong>
            {description && (
              <span style={{ fontSize: "12px", opacity: 0.9 }}>— {description}</span>
            )}
          </div>
        </div>

        <div className={styles.actionBtnRow}>
          {isExternal ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtnPrimary}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
              <ExternalLink size={11} />
            </a>
          ) : (
            <Link
              href={ctaUrl}
              className={styles.ctaBtnPrimary}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
            </Link>
          )}

          {dismissible && (
            <button
              type="button"
              onClick={(e) => handleDismiss(id, e)}
              className={styles.closeBtn}
              title="Dismiss announcement"
              aria-label="Dismiss banner"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. DASHBOARD CARD PLACEMENT
  if (placement === "dashboard_card") {
    return (
      <div
        className={`${styles.cardBannerWrap} ${className}`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <div className={styles.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className={styles.cardIconWrap}>{getIcon(icon)}</div>
            <div>
              {badgeText && (
                <span
                  className={styles.badgePill}
                  style={{ display: "inline-block", marginBottom: "3px" }}
                >
                  {badgeText}
                </span>
              )}
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>{title}</h3>
            </div>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={(e) => handleDismiss(id, e)}
              className={styles.closeBtn}
              title="Dismiss banner"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {description && (
          <p style={{ fontSize: "13px", opacity: 0.92, margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {couponCode && (
          <div className={styles.couponTag}>
            <Tag size={13} />
            <span>Use Coupon: {couponCode}</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
          {isExternal ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtnPrimary}
              style={{ background: "#0396A6", color: "#ffffff", padding: "6px 14px" }}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <Link
              href={ctaUrl}
              className={styles.ctaBtnPrimary}
              style={{ background: "#0396A6", color: "#ffffff", padding: "6px 14px" }}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
            </Link>
          )}

          {content?.secondary_cta_text && (
            <Link
              href={(content.secondary_cta_url as string) || "#"}
              className={styles.ctaBtnSecondary}
              style={{ padding: "6px 12px" }}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{content.secondary_cta_text as string}</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 3. MODAL / POPUP PLACEMENT
  if (placement === "modal") {
    return (
      <div className={styles.modalBackdrop} onClick={(e) => handleDismiss(id, e)}>
        <div
          className={styles.modalBox}
          style={{ backgroundColor: bgColor, color: textColor }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {getIcon(icon)}
              {badgeText && <span className={styles.badgePill}>{badgeText}</span>}
            </div>

            <button
              type="button"
              onClick={(e) => handleDismiss(id, e)}
              className={styles.closeBtn}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {title}
          </h3>

          {description && (
            <p style={{ fontSize: "13.5px", opacity: 0.92, margin: 0, lineHeight: 1.5 }}>
              {description}
            </p>
          )}

          {couponCode && (
            <div className={styles.couponTag}>
              <Tag size={13} />
              <span>Coupon Code: {couponCode}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
            {isExternal ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtnPrimary}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "#0396A6",
                  color: "#ffffff",
                  padding: "8px 16px",
                  fontSize: "13px",
                }}
                onClick={() => {
                  recordEvent(id, "click");
                  handleDismiss(id);
                }}
              >
                <span>{ctaText}</span>
                <ExternalLink size={13} />
              </a>
            ) : (
              <Link
                href={ctaUrl}
                className={styles.ctaBtnPrimary}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "#0396A6",
                  color: "#ffffff",
                  padding: "8px 16px",
                  fontSize: "13px",
                }}
                onClick={() => {
                  recordEvent(id, "click");
                  handleDismiss(id);
                }}
              >
                <span>{ctaText}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. FLOATING TOAST PLACEMENT
  if (placement === "floating_toast") {
    return (
      <div
        className={styles.floatingToastWrap}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {getIcon(icon)}
            <strong style={{ fontSize: "12.5px" }}>{title}</strong>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={(e) => handleDismiss(id, e)}
              className={styles.closeBtn}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {description && (
          <p style={{ fontSize: "11.5px", opacity: 0.9, margin: 0 }}>{description}</p>
        )}

        <div style={{ marginTop: "4px" }}>
          {isExternal ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtnPrimary}
              style={{ padding: "3px 8px", fontSize: "11px" }}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
            </a>
          ) : (
            <Link
              href={ctaUrl}
              className={styles.ctaBtnPrimary}
              style={{ padding: "3px 8px", fontSize: "11px" }}
              onClick={() => recordEvent(id, "click")}
            >
              <span>{ctaText}</span>
            </Link>
          )}
        </div>
      </div>
    );
  }


  return null;
}

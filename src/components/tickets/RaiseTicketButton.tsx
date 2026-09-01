"use client";

import React, { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { CreateTicketModal, TicketCategory, TicketCreatedResponse } from "./CreateTicketModal";

interface RaiseTicketButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  defaultCategory?: TicketCategory;
  defaultRelatedResource?: string;
  onTicketCreated?: (ticket: TicketCreatedResponse) => void;
  label?: string;
  icon?: boolean;
}

export function RaiseTicketButton({
  variant = "primary",
  size = "md",
  className = "",
  defaultCategory,
  defaultRelatedResource,
  onTicketCreated,
  label = "Raise Ticket",
  icon = true,
}: RaiseTicketButtonProps) {
  const [open, setOpen] = useState(false);

  const getButtonStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      fontWeight: 600,
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.15s ease",
      textDecoration: "none",
      border: "none",
      fontFamily: "inherit",
    };

    if (size === "sm") {
      Object.assign(base, {
        height: "32px",
        padding: "0 12px",
        fontSize: "12.5px",
      });
    } else if (size === "lg") {
      Object.assign(base, {
        height: "44px",
        padding: "0 22px",
        fontSize: "14.5px",
      });
    } else {
      Object.assign(base, {
        height: "38px",
        padding: "0 16px",
        fontSize: "13.5px",
      });
    }

    if (variant === "primary") {
      Object.assign(base, {
        background: "#0396A6",
        color: "#ffffff",
        boxShadow: "0 1px 2px 0 rgba(3, 150, 166, 0.2)",
      });
    } else if (variant === "outline") {
      Object.assign(base, {
        background: "#ffffff",
        color: "#0396A6",
        border: "1px solid #0396A6",
      });
    } else if (variant === "secondary") {
      Object.assign(base, {
        background: "rgba(3, 150, 166, 0.08)",
        color: "#0396A6",
      });
    } else if (variant === "ghost") {
      Object.assign(base, {
        background: "transparent",
        color: "#475569",
      });
    }

    return base;
  };

  return (
    <>
      <button
        type="button"
        style={getButtonStyles()}
        className={className}
        onClick={() => setOpen(true)}
      >
        {icon && <LifeBuoy className="w-4 h-4 shrink-0" />}
        <span>{label}</span>
      </button>

      <CreateTicketModal
        open={open}
        onOpenChange={setOpen}
        defaultCategory={defaultCategory}
        defaultRelatedResource={defaultRelatedResource}
        onTicketCreated={onTicketCreated}
      />
    </>
  );
}

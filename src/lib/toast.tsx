"use client";

import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Toast, type ToastType, type ToastPosition } from "@/components/ui/Toast";

export type ToastOptions = {
  message?: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
};

export type ToastMessage = {
  id: number;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
  hideToast: (id?: number) => void;
  /** Compat helpers used by website/inbox screens from the drsh merge. */
  toast: (options: ToastOptions | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    if (!message) return;
    const id = ++toastSeq;
    setActiveToast({
      id,
      message,
      title: options?.title,
      type: options?.type || "error",
      duration: options?.duration ?? 5000,
      position: options?.position || "bottom-right",
    });
  }, []);

  const hideToast = useCallback((id?: number) => {
    setActiveToast((prev) => {
      if (!prev) return null;
      if (id !== undefined && prev.id !== id) return prev;
      return null;
    });
  }, []);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      if (typeof options === "string") {
        showToast(options, { type: "info" });
        return;
      }
      showToast(options.message ?? "", options);
    },
    [showToast],
  );

  const success = useCallback(
    (message: string) => showToast(message, { type: "success" }),
    [showToast],
  );

  const error = useCallback(
    (message: string) => showToast(message, { type: "error", duration: 6000 }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast, success, error }}>
      {children}
      {activeToast ? (
        <Toast
          key={activeToast.id}
          message={activeToast.message}
          title={activeToast.title}
          type={activeToast.type}
          duration={activeToast.duration}
          position={activeToast.position}
          onClose={() => hideToast(activeToast.id)}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside ToastProvider
    return {
      showToast: (msg: string) => {
        if (typeof window !== "undefined") {
          console.warn("[Toast] Triggered outside ToastProvider:", msg);
        }
      },
      hideToast: () => {},
      toast: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return ctx;
}

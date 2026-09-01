"use client";

import { useEffect } from "react";
import styles from "./Toast.module.css";

export type ToastType = "error" | "warning" | "success" | "info";
export type ToastPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

type ToastProps = {
  message: string | null;
  title?: string;
  type?: ToastType;
  duration?: number; // ms, default 5000 (5 seconds)
  position?: ToastPosition;
  onClose: () => void;
};

export function Toast({
  message,
  title,
  type = "error",
  duration = 5000,
  position = "bottom-right",
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;

    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const positionClass =
    position === "bottom-left"
      ? styles.bottomLeft
      : position === "top-right"
      ? styles.topRight
      : position === "top-left"
      ? styles.topLeft
      : styles.bottomRight;

  const typeClass =
    type === "warning"
      ? styles.warning
      : type === "success"
      ? styles.success
      : type === "info"
      ? styles.info
      : styles.error;

  const iconName =
    type === "warning"
      ? "warning"
      : type === "success"
      ? "check_circle"
      : type === "info"
      ? "info"
      : "error";

  return (
    <div className={`${styles.toastContainer} ${positionClass}`} role="alert" aria-live="assertive">
      <div className={`${styles.toast} ${typeClass}`}>
        <div className={styles.toastIcon}>
          <span className="material-symbols-outlined">{iconName}</span>
        </div>
        <div className={styles.toastContent}>
          {title && <h4 className={styles.toastTitle}>{title}</h4>}
          <p className={styles.toastMessage}>{message}</p>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close notification"
          title="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import styles from "./AlertModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  icon: string;
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  cancelText?: string;
  variant?: "danger" | "primary" | "ghost";
};

export function AlertModal({
  isOpen,
  onClose,
  icon,
  title,
  description,
  confirmText,
  onConfirm,
  cancelText = "Cancel",
  variant = "danger",
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles.alertModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.alertIcon}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h2 className={styles.alertTitle}>{title}</h2>
        <p className={styles.alertSub}>{description}</p>
        
        <div className={styles.alertFooter}>
          <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

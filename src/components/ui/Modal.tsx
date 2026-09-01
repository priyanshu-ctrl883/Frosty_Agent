"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg";
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "md",
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={`${styles.content} ${styles[width]}`}>
          <div className={styles.header}>
            <div>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className={styles.description}>
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close className={styles.closeBtn} aria-label="Close">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className={styles.body}>{children}</div>

          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

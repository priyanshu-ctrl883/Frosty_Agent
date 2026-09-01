"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, HelpCircle, X } from "lucide-react";

export type ConfirmModalProps = {
  show?: boolean;
  isOpen?: boolean;
  title: string;
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  tone?: "primary" | "danger" | "warning";
  confirmText?: string;
  cancelText?: string;
  /** When set, confirm stays disabled until the user types this exact phrase (e.g. CANCEL). */
  confirmPhrase?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
};

export function ConfirmModal({
  show,
  isOpen,
  title,
  message,
  description,
  icon,
  tone = "primary",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmPhrase,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const visible = show ?? isOpen ?? false;
  const handleClose = onCancel ?? onClose ?? (() => {});
  const phraseOk = !confirmPhrase || typed === confirmPhrase;

  useEffect(() => {
    if (!visible) setTyped("");
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = async () => {
    if (!phraseOk) return;
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const defaultIcon = tone === "danger"
    ? <Trash2 className="w-5 h-5 text-red-600" />
    : tone === "warning"
    ? <AlertTriangle className="w-5 h-5 text-amber-600" />
    : <HelpCircle className="w-5 h-5 text-primary" />;

  const iconBg = tone === "danger"
    ? "bg-red-50 border-red-100"
    : tone === "warning"
    ? "bg-amber-50 border-amber-100"
    : "bg-[rgba(3,150,166,0.08)] border-[rgba(3,150,166,0.15)]";

  const confirmBtnClass = tone === "danger"
    ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20"
    : tone === "warning"
    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20"
    : "bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20";

  return typeof window !== "undefined" ? createPortal(
    <AnimatePresence>
      {visible && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[999999] bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden text-gray-900 select-none my-auto"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className={`shrink-0 p-2.5 rounded-xl border ${iconBg}`}>
                  {icon || defaultIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-serif font-bold text-gray-900 truncate">
                      {title}
                    </h3>
                    <button
                      onClick={handleClose}
                      disabled={loading}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                    {message || description}
                  </p>
                  {confirmPhrase ? (
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Type <code className="px-1 py-0.5 rounded bg-gray-100">{confirmPhrase}</code> to confirm
                      </label>
                      <input
                        type="text"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                        placeholder={confirmPhrase}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-gray-50/80 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !phraseOk}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${confirmBtnClass}`}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {loading && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;
}

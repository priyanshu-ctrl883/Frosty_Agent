"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

export interface StorageUsage {
  merchant_id: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  storage_remaining_bytes: number;
  usage_percentage: number;
  storage_per_seat_bytes?: number | null;
  seats_count: number;
  limit_source: string;
  used_formatted: string;
  limit_formatted: string;
  remaining_formatted: string;
}

export function notifyStorageUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("frosty:storage_updated"));
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("frosty_sync");
        bc.postMessage({ type: "storage_updated" });
        bc.close();
      }
    } catch {
      // ignore
    }
  }
}

export function useStorageUsage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<StorageUsage>("/v1/storage/usage");
      setUsage(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load storage usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsage();

    const handleUpdate = () => {
      void fetchUsage();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("frosty:storage_updated", handleUpdate);
      let bc: BroadcastChannel | null = null;
      try {
        if (typeof BroadcastChannel !== "undefined") {
          bc = new BroadcastChannel("frosty_sync");
          bc.onmessage = (e) => {
            if (e.data?.type === "storage_updated") {
              void fetchUsage();
            }
          };
        }
      } catch {
        // ignore
      }

      return () => {
        window.removeEventListener("frosty:storage_updated", handleUpdate);
        if (bc) bc.close();
      };
    }
  }, [fetchUsage]);

  const isAtLimit = usage ? usage.storage_used_bytes >= usage.storage_limit_bytes : false;
  const isNearLimit = usage ? !isAtLimit && usage.usage_percentage >= 90 : false;

  return {
    usage,
    loading,
    error,
    isAtLimit,
    isNearLimit,
    refresh: fetchUsage,
  };
}

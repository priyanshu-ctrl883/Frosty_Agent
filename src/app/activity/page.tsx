"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Standalone /activity route — redirects to Settings > Activity tab. */
export default function ActivityPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings?tab=activity");
  }, [router]);
  return null;
}

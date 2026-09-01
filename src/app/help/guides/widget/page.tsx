"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Old URL — keep bookmarks working. */
export default function LegacyWidgetGuide() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/help/guides/install-widget");
  }, [router]);
  return null;
}

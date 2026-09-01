"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyWhatsappGuide() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/help/guides/connect-whatsapp");
  }, [router]);
  return null;
}

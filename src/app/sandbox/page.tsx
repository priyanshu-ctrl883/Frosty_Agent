"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy /sandbox route — sandbox lives under Web Agent → Settings → Sandbox. */
export default function SandboxPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/website?tab=settings&subtab=sandbox");
  }, [router]);

  return null;
}

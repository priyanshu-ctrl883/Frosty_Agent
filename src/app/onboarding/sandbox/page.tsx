"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy Step-5 sandbox wizard — redirect to the hub Sandbox test step (D193). */
export default function SandboxPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding");
  }, [router]);
  return (
    <main className="min-h-[50vh] flex items-center justify-center text-sm text-slate-500">
      Redirecting to onboarding…
    </main>
  );
}

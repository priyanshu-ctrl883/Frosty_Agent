"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy fake-chat test page — redirect to the hub Sandbox step (D199). */
export default function OnboardingTestPageRedirect() {
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

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy payment wait page — redirect to the hub (setup fee lives in Choose plan / Pay setup fee) (D199). */
export default function OnboardingPaymentPageRedirect() {
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

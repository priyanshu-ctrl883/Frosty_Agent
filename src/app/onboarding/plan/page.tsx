"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy plan wizard — redirect to the hub Choose plan step (D199). */
export default function OnboardingPlanPageRedirect() {
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

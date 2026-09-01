"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy Step-4-of-5 knowledge wizard — redirect to the hub Add knowledge step (D192). */
export default function AddKnowledgePageRedirect() {
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

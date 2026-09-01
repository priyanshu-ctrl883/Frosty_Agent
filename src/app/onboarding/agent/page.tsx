"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy Step-2-of-5 agent wizard — redirect to the hub Create agent step (D191). */
export default function CreateAgentPageRedirect() {
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

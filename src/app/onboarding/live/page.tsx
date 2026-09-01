"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy go-live wizard — redirect to the hub Go live step (D198). */
export default function LivePageRedirect() {
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

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy publish wizard — redirect to the hub Publish agent step (D194). */
export default function PublishPageRedirect() {
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

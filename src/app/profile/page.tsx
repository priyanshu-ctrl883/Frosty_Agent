"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/PageState";

/**
 * Profile page has been unified into Settings -> Company Profile.
 * Automatically redirect any visitors or legacy links directly to /settings.
 */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return <Loading label="Redirecting to Settings..." />;
}

import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function BillingLoading() {
  return <LoadingAppShell><PageSkeleton /></LoadingAppShell>;
}

import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return <LoadingAppShell><DashboardSkeleton /></LoadingAppShell>;
}

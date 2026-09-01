import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return <LoadingAppShell><DashboardSkeleton /></LoadingAppShell>;
}

import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function QuotesLoading() {
  return <LoadingAppShell><TableSkeleton /></LoadingAppShell>;
}

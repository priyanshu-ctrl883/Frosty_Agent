import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function HelpLoading() {
  return <LoadingAppShell><PageSkeleton /></LoadingAppShell>;
}

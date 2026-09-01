import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { InboxSkeleton } from "@/components/ui/Skeleton";

export default function InboxLoading() {
  return <LoadingAppShell><InboxSkeleton /></LoadingAppShell>;
}

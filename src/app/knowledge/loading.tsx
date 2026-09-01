import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { KnowledgeSkeleton } from "@/components/ui/Skeleton";

export default function KnowledgeLoading() {
  return <LoadingAppShell><KnowledgeSkeleton /></LoadingAppShell>;
}

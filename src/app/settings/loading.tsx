import { LoadingAppShell } from "@/components/shell/LoadingAppShell";
import { SettingsSkeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return <LoadingAppShell><SettingsSkeleton /></LoadingAppShell>;
}

'use client';

import { ToastProvider } from '@/lib/toast';
import { ActivityContent } from '@/app/activity/ActivityContent';

/**
 * Settings > Activity tab — renders the full activity log UI embedded in the settings panel.
 * ActivityContent is self-contained (manages its own data fetching and state).
 */
export function SettingsActivityTab({ canAudit }: { canAudit: boolean }) {
  if (!canAudit) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          You need <strong>team:manage</strong> permission to view the activity log.
        </p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col h-full">
        <ActivityContent showActions />
      </div>
    </ToastProvider>
  );
}

"use client";
import { useUi } from "@/components/common/UiText";

import { ActionNeededList } from "@/components/dashboard/ActionNeededList";
import { useDashboardActionNeeded } from "@/hooks/useDashboard";

/** Data-fetching wrapper around the shared ActionNeededList — see lib/dashboardActionNeeded.ts for what's computed and why. */
export function DashboardActionNeeded() {
  const ui = useUi();
  const { data, isLoading, isError } = useDashboardActionNeeded();

  return (
    <ActionNeededList
      items={data ?? []}
      isLoading={isLoading}
      isError={isError}
      emptyDescription={ui("You're on top of your listings and appointments.")}
    />
  );
}

"use client";
import { UiText, useUi } from "@/components/common/UiText";


import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AppointmentStatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AppointmentActionPolicy } from "@/lib/appointmentActionPolicy";
import { formatDateTime } from "@/lib/formatters";
import type { Appointment } from "@/types";

interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onAction: (
    appointment: Appointment,
    action: ReturnType<typeof AppointmentActionPolicy.getActions>[number],
  ) => void;
  isPending: boolean;
}

/**
 * A side panel (swipeDirection="right") showing the full lifecycle of a
 * single appointment via the reusable ActivityTimeline — the same component
 * Dashboard Home uses for its recent-activity feed — plus the same
 * status-aware actions the row menu offers, for when a developer wants the
 * fuller context of the history before deciding what to do next.
 */
export function AppointmentDetailsDrawer({
  appointment,
  onOpenChange,
  onAction,
  isPending,
}: AppointmentDetailsDrawerProps) {
  const ui = useUi();
  const actions = appointment
    ? AppointmentActionPolicy.getActions(appointment.status)
    : [];

  return (
    <Drawer
      open={Boolean(appointment)}
      onOpenChange={onOpenChange}
      swipeDirection="right"
    >
      <DrawerContent>
        {appointment && (
          <>
            <DrawerHeader>
              <DrawerTitle>{appointment.clientName}</DrawerTitle>
              <DrawerDescription>{appointment.propertyTitle}</DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm"><UiText text={"Scheduled for"} />{" "}{formatDateTime(appointment.scheduledFor)}
                </span>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              {appointment.previousScheduledFor && (
                <p className="text-muted-foreground text-xs"><UiText text={"Originally scheduled for"} />{" "}
                  {formatDateTime(appointment.previousScheduledFor)}
                </p>
              )}

              <div>
                <h3 className="mb-3 text-sm font-medium"><UiText text={"History"} /></h3>
                {appointment.history && appointment.history.length > 0 ? (
                  <ActivityTimeline items={appointment.history} />
                ) : (
                  <p className="text-muted-foreground text-sm"><UiText text={"No history recorded yet."} />{" "}</p>
                )}
              </div>
            </div>

            {actions.length > 0 && (
              <DrawerFooter className="flex-row flex-wrap justify-end">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={
                      action.key === ui("CANCEL") ? "destructive" : "outline"
                    }
                    size="sm"
                    disabled={isPending}
                    onClick={() => onAction(appointment, action)}
                  >
                    <UiText text={action.label} />
                  </Button>
                ))}
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

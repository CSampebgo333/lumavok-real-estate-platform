"use client";
import { UiText } from "@/components/common/UiText";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NavigationGuardDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Generic unsaved-changes confirmation — the UI half of useNavigationGuard, reusable by any dashboard form. */
export function NavigationGuardDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: NavigationGuardDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle><UiText text={"Leave without saving?"} /></DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}><UiText text={"Stay"} />{" "}</Button>
          <Button variant="destructive" onClick={onConfirm}><UiText text={"Leave"} />{" "}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

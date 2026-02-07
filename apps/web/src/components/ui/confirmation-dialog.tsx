"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  icon?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  icon,
  isPending = false,
  onConfirm,
}: ConfirmationDialogProps) {
  const tCommon = useTranslations("Common");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`flex items-center gap-2 ${
              variant === "destructive" ? "text-destructive" : ""
            }`}
          >
            {icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel || tCommon("cancel")}
          </AlertDialogCancel>
          {/* We use Button inside AlertDialogAction or just a custom button to handle loading state better */}
          {/* AlertDialogAction closes automatically, so for async we might need to control it. 
              However, assuming onConfirm handles the logic, we can just use a Button styling. 
              But shadcn/ui AlertDialogAction triggers the action. 
              If we want to prevent closing on click until async finishes, we need `event.preventDefault()`.
          */}
          <AlertDialogAction
            onClick={(e) => {
              if (isPending) {
                e.preventDefault();
                return;
              }
              // If it's a promise, we might want to prevent default until it resolves, 
              // but typically the parent component handles `isPending` via mutation state.
              // For simplicity, we just execute onConfirm. 
              // If we want to keep dialog open while pending, user should pass isPending=true.
              onConfirm();
            }}
            disabled={isPending}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {tCommon("processing")}
              </>
            ) : (
              confirmLabel || tCommon("confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

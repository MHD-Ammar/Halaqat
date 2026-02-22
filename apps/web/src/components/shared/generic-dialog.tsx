import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Props for the GenericDialog component
 */
export interface GenericDialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback for when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** ReactNode that triggers the dialog to open (if uncontrolled) */
  trigger?: ReactNode;
  /** Title of the dialog */
  title: string | ReactNode;
  /** Description text below the title */
  description?: string | ReactNode;
  /** Content of the dialog (typically a form or details view) */
  children: ReactNode;
  /** Additional CSS classes for DialogContent (e.g., "sm:max-w-[500px]") */
  className?: string;
  /** Controls if interacting outside the dialog closes it */
  preventOutsideClose?: boolean;
}

/**
 * A generic dialog wrapper that standardizes modals across the application.
 * Reduces boilerplate required for basic Radix UI Dialog components.
 *
 * @example
 * ```tsx
 * <GenericDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create User"
 *   description="Fill out the details below to add a new user."
 *   className="sm:max-w-[425px]"
 * >
 *   <UserForm onSubmit={() => setIsOpen(false)} />
 * </GenericDialog>
 * ```
 */
export function GenericDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
  preventOutsideClose = false,
}: GenericDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent 
        className={className}
        onInteractOutside={(e) => {
          if (preventOutsideClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        {children}
      </DialogContent>
    </Dialog>
  );
}

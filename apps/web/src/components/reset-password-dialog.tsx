"use client";

import { CrudDialog } from "@/components/ui/crud-dialog";
import { TextField } from "@/components/ui/form-fields";
import { toast } from "@/hooks/use-toast";
import { useResetPassword, type User } from "@/hooks/use-users";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/user";

interface ResetPasswordDialogProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ open, user, onOpenChange }: ResetPasswordDialogProps) {
  const resetPasswordMutation = useResetPassword();

  return (
    <CrudDialog<ResetPasswordInput, unknown>
      open={open}
      onOpenChange={onOpenChange}
      title="إعادة تعيين كلمة المرور"
      description={user ? `تعيين كلمة مرور جديدة لـ ${user.fullName}` : ""}
      schema={resetPasswordSchema}
      defaultValues={{ password: "" }}
      submitLabel="تعيين"
      size="sm"
      onSubmit={(values) =>
        resetPasswordMutation.mutateAsync({ userId: user!.id, password: values.password })
      }
      onSuccess={() =>
        toast({ title: "تم إعادة التعيين", description: "تم تعيين كلمة المرور الجديدة بنجاح" })
      }
    >
      {() => (
        <TextField
          name="password"
          label="كلمة المرور الجديدة"
          type="text"
          placeholder="أدخل كلمة المرور الجديدة"
          required
        />
      )}
    </CrudDialog>
  );
}

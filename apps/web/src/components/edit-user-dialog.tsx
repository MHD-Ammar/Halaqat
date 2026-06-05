"use client";

import { CrudDialog } from "@/components/ui/crud-dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import { toast } from "@/hooks/use-toast";
import { useUpdateUser, type User } from "@/hooks/use-users";
import {
  editUserSchema,
  USER_ROLES,
  USER_ROLE_LABELS,
  type EditUserInput,
} from "@/lib/schemas/user";

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ open, user, onOpenChange }: EditUserDialogProps) {
  const updateMutation = useUpdateUser();

  // Pre-populate from the user object whenever the dialog opens.
  // CrudDialog resets to defaultValues on close; we need a dynamic defaultValues.
  // We achieve this by deriving defaultValues from `user` — the key trick is that
  // CrudDialog reads defaultValues on mount AND on open→false transition.
  const defaultValues: EditUserInput = {
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    role: (user?.role as EditUserInput["role"]) ?? "TEACHER",
  };

  return (
    <CrudDialog<EditUserInput, unknown>
      open={open}
      onOpenChange={onOpenChange}
      title="تعديل بيانات المستخدم"
      description="عدّل المعلومات الأساسية للمستخدم"
      schema={editUserSchema}
      defaultValues={defaultValues}
      mode="edit"
      onSubmit={(values) =>
        updateMutation.mutateAsync({ id: user!.id, ...values })
      }
      onSuccess={() =>
        toast({ title: "تم التحديث", description: "تم تحديث بيانات المستخدم بنجاح" })
      }
      size="sm"
    >
      {() => (
        <>
          <TextField name="fullName" label="الاسم الكامل" required />
          <TextField name="email" label="البريد الإلكتروني" type="email" required />
          <TextField
            name="phoneNumber"
            label="رقم الهاتف"
            type="tel"
            placeholder="+966 50 123 4567"
            required
            sanitize={(v) => v.replace(/[^0-9+\-\s()]/g, "")}
          />
          <SelectField
            name="role"
            label="الدور"
            required
            options={USER_ROLES.map((r) => ({ value: r, label: USER_ROLE_LABELS[r] }))}
          />
        </>
      )}
    </CrudDialog>
  );
}

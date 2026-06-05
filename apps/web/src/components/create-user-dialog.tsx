"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/ui/crud-dialog";
import {
  SelectField,
  TextField,
} from "@/components/ui/form-fields";
import { useUserProfile } from "@/hooks";
import { useCreateUser } from "@/hooks/use-create-user";
import { useToast } from "@/hooks/use-toast";
import {
  createUserSchema,
  USER_ROLES,
  USER_ROLE_LABELS,
  type CreateUserInput,
} from "@/lib/schemas/user";

interface CreateUserDialogProps {
  children?: React.ReactNode;
}

export function CreateUserDialog({ children }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateUser();
  const { data: profile } = useUserProfile();

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer", display: "contents" }}>
        {children || (
          <Button>
            <UserPlus className="h-4 w-4 me-2" />
            إضافة مستخدم
          </Button>
        )}
      </span>

      <CrudDialog<CreateUserInput, unknown>
        open={open}
        onOpenChange={setOpen}
        title="إضافة مستخدم جديد"
        description="أنشئ حساباً جديداً وحدّد دوره في النظام"
        schema={createUserSchema}
        defaultValues={{ fullName: "", email: "", phoneNumber: "", password: "", role: "TEACHER" }}
        onSubmit={(values) =>
          createMutation.mutateAsync({
            ...values,
            ...(profile?.mosqueId ? { mosqueId: profile.mosqueId } : {}),
          })
        }
        onSuccess={(_, values) =>
          toast({
            title: "تم إنشاء المستخدم",
            description: `تم إنشاء حساب ${values.fullName} بنجاح`,
          })
        }
        size="sm"
      >
        {() => (
          <>
            <TextField name="fullName" label="الاسم الكامل" placeholder="مثلاً: أحمد محمد" required />
            <TextField name="email" label="البريد الإلكتروني" type="email" placeholder="user@example.com" required />
            <TextField
              name="phoneNumber"
              label="رقم الهاتف"
              type="tel"
              placeholder="+966 50 123 4567"
              required
              sanitize={(v) => v.replace(/[^0-9+\-\s()]/g, "")}
            />
            <TextField name="password" label="كلمة المرور" type="password" required />
            <SelectField
              name="role"
              label="الدور"
              required
              placeholder="اختر دوراً"
              options={USER_ROLES.map((r) => ({ value: r, label: USER_ROLE_LABELS[r] }))}
            />
          </>
        )}
      </CrudDialog>
    </>
  );
}

"use client";

import { CrudDialog } from "@/components/ui/crud-dialog";
import {
  DateField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/ui/form-fields";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCircles } from "@/hooks/use-circles";
import { useUpdateStudent, type Student } from "@/hooks/use-students";
import { toast } from "@/hooks/use-toast";
import {
  editStudentSchema,
  type EditStudentInput,
} from "@/lib/schemas/student";

interface EditStudentDialogProps {
  open: boolean;
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  readonlyCircle?: boolean;
}

export function EditStudentDialog({
  open,
  student,
  onOpenChange,
  readonlyCircle = false,
}: EditStudentDialogProps) {
  const updateMutation = useUpdateStudent();
  const { data: circles = [], isLoading: circlesLoading } = useCircles({
    enabled: open && !readonlyCircle,
  });

  const defaultValues: EditStudentInput = {
    name: student?.name ?? "",
    circleId: student?.circleId ?? "",
    phone: student?.phone ?? "",
    dob: student?.dob ? student.dob.split("T")[0] : "",
    address: student?.address ?? "",
    notes: student?.notes ?? "",
    guardianName: student?.guardianName ?? "",
    guardianPhone: student?.guardianPhone ?? "",
  };

  const circleOptions = circles.map((c) => ({ value: c.id, label: c.name }));

  return (
    <CrudDialog<EditStudentInput, unknown>
      open={open}
      onOpenChange={onOpenChange}
      title="تعديل بيانات الطالب"
      description="عدّل معلومات الطالب وبيانات ولي الأمر"
      schema={editStudentSchema}
      defaultValues={defaultValues}
      mode="edit"
      size="lg"
      onSubmit={(values) =>
        updateMutation.mutateAsync({
          id: student!.id,
          name: values.name,
          circleId: values.circleId,
          dob: values.dob ? new Date(values.dob).toISOString() : null,
          phone: values.phone || null,
          address: values.address || null,
          notes: values.notes || null,
          guardianName: values.guardianName || null,
          guardianPhone: values.guardianPhone || null,
        } as Parameters<typeof updateMutation.mutateAsync>[0])
      }
      onSuccess={() =>
        toast({ title: "تم التحديث", description: "تم تحديث بيانات الطالب بنجاح" })
      }
    >
      {() => (
        <ScrollArea className="max-h-[55vh] px-1">
          <div className="space-y-6 px-3 pb-2">
            {/* ── Student info ──────────────────────────────────── */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                بيانات الطالب
              </p>
              <TextField name="name" label="الاسم الكامل" required />

              {readonlyCircle ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 px-3 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    الحلقة
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {student?.circle?.name ?? "—"}
                  </span>
                </div>
              ) : (
                <SelectField
                  name="circleId"
                  label="الحلقة"
                  required
                  disabled={circlesLoading}
                  placeholder={circlesLoading ? "جاري التحميل..." : "اختر الحلقة"}
                  options={circleOptions}
                />
              )}

              <TextField
                name="phone"
                label="رقم هاتف الطالب (اختياري)"
                type="tel"
                placeholder="+966 50 123 4567"
                sanitize={(v) => v.replace(/[^0-9+\-\s()]/g, "")}
              />
              <DateField name="dob" label="تاريخ الميلاد (اختياري)" />
              <TextField name="address" label="العنوان (اختياري)" />
              <TextareaField name="notes" label="ملاحظات (اختياري)" rows={3} />
            </div>

            <Separator />

            {/* ── Guardian info ─────────────────────────────────── */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                بيانات ولي الأمر
              </p>
              <TextField name="guardianName" label="اسم ولي الأمر (اختياري)" />
              <TextField
                name="guardianPhone"
                label="هاتف ولي الأمر (اختياري)"
                type="tel"
                placeholder="+966 50 123 4567"
                sanitize={(v) => v.replace(/[^0-9+\-\s()]/g, "")}
              />
            </div>
          </div>
        </ScrollArea>
      )}
    </CrudDialog>
  );
}

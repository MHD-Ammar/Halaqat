"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/ui/crud-dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import {
  useAuth,
  useCircle,
  useCircles,
  useCreateStudent,
  useMyCircles,
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/lib/schemas/student";

const isUuid = (val: unknown): val is string =>
  typeof val === "string" &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

interface CreateStudentDialogProps {
  children?: React.ReactNode;
  defaultCircleId?: string;
}

export function CreateStudentDialog({
  children,
  defaultCircleId,
}: CreateStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isTeacher } = useAuth();
  const createMutation = useCreateStudent();

  // ── Circle data loading ────────────────────────────────────────────────────
  const { data: adminCircles = [], isLoading: adminLoading } = useCircles({
    enabled: !!(open && isAdmin && !isUuid(defaultCircleId)),
  });
  const { data: teacherCircles = [], isLoading: teacherLoading } = useMyCircles({
    enabled: !!(open && isTeacher && !isUuid(defaultCircleId)),
  });
  const { data: defaultCircle, isLoading: defaultCircleLoading } = useCircle(
    defaultCircleId,
    { enabled: !!(open && isUuid(defaultCircleId)) },
  );

  const circles = isUuid(defaultCircleId)
    ? defaultCircle ? [defaultCircle] : []
    : isAdmin ? adminCircles : teacherCircles;

  const circlesLoading = adminLoading || teacherLoading || defaultCircleLoading;

  const circleOptions = circles.map((c) => ({ value: c.id, label: c.name }));
  const showCircleSelect = !isUuid(defaultCircleId) && circles.length > 1;
  const autoCircleId =
    isUuid(defaultCircleId)
      ? defaultCircleId
      : circles.length === 1 ? circles[0]?.id ?? "" : "";

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", display: "contents" }}
      >
        {children || (
          <Button>
            <Plus className="h-4 w-4 me-2" />
            إضافة طالب
          </Button>
        )}
      </span>

      <CrudDialog<CreateStudentInput, unknown>
        open={open}
        onOpenChange={setOpen}
        title="إضافة طالب جديد"
        schema={createStudentSchema}
        defaultValues={{
          name: "",
          circleId: isUuid(defaultCircleId) ? defaultCircleId : "",
          guardianName: "",
          guardianPhone: "",
        }}
        onSubmit={(values) =>
          createMutation.mutateAsync({
            name: values.name,
            circleId: values.circleId,
            ...(values.guardianName ? { guardianName: values.guardianName } : {}),
            ...(values.guardianPhone ? { guardianPhone: values.guardianPhone } : {}),
          })
        }
        onSuccess={(_, values) =>
          toast({
            title: "تم إضافة الطالب",
            description: `تم إضافة ${values.name} بنجاح`,
          })
        }
        size="sm"
      >
        {(form) => {
          // Auto-set circleId when there's only one option
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (!open || circlesLoading) return;
            if (autoCircleId && !form.getValues("circleId")) {
              form.setValue("circleId", autoCircleId, { shouldValidate: true });
            }
          }, [open, circlesLoading, autoCircleId, form]);

          const currentCircleId = form.watch("circleId");
          const selectedCircle = circles.find((c) => c.id === currentCircleId);

          return (
            <>
              <TextField name="name" label="اسم الطالب" placeholder="الاسم الكامل" required />

              {/* Circle selection — only shown when there are multiple choices */}
              {circlesLoading ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
                  <div className="h-10 w-full rounded border border-dashed bg-muted/30 animate-pulse" />
                </div>
              ) : showCircleSelect ? (
                <SelectField
                  name="circleId"
                  label="الحلقة"
                  required
                  placeholder="اختر الحلقة"
                  options={circleOptions}
                />
              ) : selectedCircle ? (
                // Pre-selected — show a read-only summary chip
                <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 px-3 py-2.5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    الحلقة
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {selectedCircle.name}
                  </span>
                </div>
              ) : null}

              <TextField name="guardianName" label="اسم ولي الأمر (اختياري)" />
              <TextField
                name="guardianPhone"
                label="هاتف ولي الأمر (اختياري)"
                type="tel"
                placeholder="+123..."
                sanitize={(v) => v.replace(/[^0-9+\-\s()]/g, "")}
              />
            </>
          );
        }}
      </CrudDialog>
    </>
  );
}

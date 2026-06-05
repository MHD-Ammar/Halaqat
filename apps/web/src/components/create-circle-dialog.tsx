"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/ui/crud-dialog";
import {
  AsyncSelectField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/ui/form-fields";
import { useCreateCircle, useUpdateCircle, type Circle } from "@/hooks";
import { type Teacher } from "@/hooks/use-teachers";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  CIRCLE_GENDER_LABELS,
  CIRCLE_GENDERS,
  createCircleSchema,
  type CreateCircleInput,
} from "@/lib/schemas/circle";

// Stable queryFn — same key as useTeachers so TanStack Query deduplicates requests
const fetchTeachers = (): Promise<Teacher[]> =>
  apiClient.get<Teacher[]>("/users", { params: { role: "TEACHER" } });

interface CreateCircleDialogProps {
  children?: React.ReactNode;
  /** When provided, the dialog runs in edit mode. */
  circle?: Circle;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCircleDialog({
  children,
  circle,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateCircleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const { toast } = useToast();
  const createMutation = useCreateCircle();
  const updateMutation = useUpdateCircle();
  const isEditMode = !!circle;

  const defaultValues: CreateCircleInput = {
    name: circle?.name ?? "",
    description: circle?.description ?? "",
    gender: (circle?.gender as CreateCircleInput["gender"]) ?? ("" as never),
    teacherId: circle?.teacherId ?? "",
  };

  return (
    <>
      {!isControlled && (
        <span
          onClick={() => setOpen(true)}
          style={{ cursor: "pointer", display: "contents" }}
        >
          {children || (
            <Button>
              <Plus className="h-4 w-4 me-2" />
              حلقة جديدة
            </Button>
          )}
        </span>
      )}

      <CrudDialog<CreateCircleInput, unknown>
        open={open}
        onOpenChange={setOpen}
        title={isEditMode ? "تعديل الحلقة" : "إضافة حلقة جديدة"}
        description={
          isEditMode ? "عدّل بيانات الحلقة" : "أنشئ حلقة جديدة وعيّن لها معلماً"
        }
        schema={createCircleSchema}
        defaultValues={defaultValues}
        mode={isEditMode ? "edit" : "create"}
        onSubmit={(values) =>
          (() => {
            const payload = {
              name: values.name,
              gender: values.gender,
              teacherId: values.teacherId,
              ...(values.description ? { description: values.description } : {}),
            };
            return isEditMode
              ? updateMutation.mutateAsync({ id: circle!.id, data: payload })
              : createMutation.mutateAsync(payload);
          })()
        }
        onSuccess={(_, values) =>
          toast({
            title: isEditMode ? "تم تحديث الحلقة" : "تم إنشاء الحلقة",
            description: `حلقة "${values.name}" ${isEditMode ? "تم تحديثها" : "تم إنشاؤها"} بنجاح`,
          })
        }
        size="sm"
      >
        {() => (
          <>
            <TextField
              name="name"
              label="اسم الحلقة"
              placeholder="مثلاً: حلقة الفجر"
              required
            />
            <AsyncSelectField<Teacher>
              name="teacherId"
              label="المعلم المسؤول"
              queryKey={queryKeys.teachers.list()}
              queryFn={fetchTeachers}
              getOptionValue={(t) => t.id}
              getOptionLabel={(t) => t.fullName}
              placeholder="اختر معلماً"
              required
            />
            <SelectField
              name="gender"
              label="نوع الحلقة"
              required
              placeholder="اختر النوع"
              options={CIRCLE_GENDERS.map((g) => ({
                value: g,
                label: CIRCLE_GENDER_LABELS[g],
              }))}
            />
            <TextareaField name="description" label="الوصف (اختياري)" rows={3} />
          </>
        )}
      </CrudDialog>
    </>
  );
}

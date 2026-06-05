"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CrudDialog } from "@/components/ui/crud-dialog";
import { NumberField, SwitchField, TextField } from "@/components/ui/form-fields";
import { useCreateCustomRule } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import {
  createCustomRuleSchema,
  type CreateCustomRuleInput,
} from "@/lib/schemas/custom-rule";

interface CreateCustomRuleDialogProps {
  children?: React.ReactNode;
}

const DEFAULT_VALUES: CreateCustomRuleInput = {
  description: "",
  points: 5,
  isCustomEntry: false,
  maxCustomValue: 20,
};

export function CreateCustomRuleDialog({ children }: CreateCustomRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createRule = useCreateCustomRule();

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", display: "contents" }}
      >
        {children || (
          <Button size="sm">
            <Plus className="h-4 w-4 me-2" />
            إضافة قاعدة
          </Button>
        )}
      </span>

      <CrudDialog<CreateCustomRuleInput, unknown>
        open={open}
        onOpenChange={setOpen}
        title="إضافة قاعدة مخصصة"
        description="أنشئ فئة مكافأة جديدة للمعلمين"
        schema={createCustomRuleSchema}
        defaultValues={DEFAULT_VALUES}
        submitLabel="إضافة"
        size="sm"
        onSubmit={(values) =>
          createRule.mutateAsync({
            description: values.description.trim(),
            points: values.points,
            isVisibleToTeacher: true,
            isCustomEntry: values.isCustomEntry,
            ...(values.isCustomEntry && typeof values.maxCustomValue === "number"
              ? { maxCustomValue: values.maxCustomValue }
              : {}),
          })
        }
        onSuccess={() =>
          toast({ title: "تم الإضافة", description: "تم إنشاء القاعدة المخصصة بنجاح" })
        }
      >
        {(form) => {
          const isCustomEntry = form.watch("isCustomEntry");
          return (
            <>
              <TextField
                name="description"
                label="الوصف"
                placeholder="مثلاً: حفظ صفحة"
                required
              />
              <NumberField
                name="points"
                label="النقاط الافتراضية"
                min={0}
                max={100}
                required
              />
              <SwitchField
                name="isCustomEntry"
                label="إدخال مخصص"
                description="يسمح للمعلم بإدخال قيمة مخصصة بدلاً من القيمة الافتراضية"
              />
              {isCustomEntry && (
                <NumberField
                  name="maxCustomValue"
                  label="الحد الأقصى للقيمة المخصصة"
                  min={1}
                  max={100}
                  required
                />
              )}
            </>
          );
        }}
      </CrudDialog>
    </>
  );
}

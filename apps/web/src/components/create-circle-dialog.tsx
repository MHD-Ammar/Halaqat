"use client";

/**
 * CreateCircleDialog Component
 *
 * Dialog for creating a new study circle.
 * Includes required fields: name, teacher, and gender.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCircle, useUpdateCircle, useTeachers, Circle } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

interface CreateCircleDialogProps {
  /** Optional custom trigger button */
  children?: React.ReactNode;
  /** Optional circle to edit. If provided, dialog will be in edit mode */
  circle?: Circle;
  /** Optional open state control */
  open?: boolean;
  /** Optional onOpenChange handler */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog component for creating or editing study circles
 */
export function CreateCircleDialog({
  children,
  circle,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateCircleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const { toast } = useToast();
  const createMutation = useCreateCircle();
  const updateMutation = useUpdateCircle();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();

  const isEditMode = !!circle;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const t = useTranslations("Circles");
  const tCommon = useTranslations("Common");

  // Define schema with translations
  const createCircleSchema = z.object({
    name: z.string().min(2, t("validationName")),
    description: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"], {
      message: t("validationGender"),
    }),
    teacherId: z.string().uuid(t("validationTeacher")),
  });

  type CreateCircleFormData = z.infer<typeof createCircleSchema>;

  const form = useForm<CreateCircleFormData>({
    resolver: zodResolver(createCircleSchema),
    defaultValues: {
      name: "",
      description: "",
      gender: undefined,
      teacherId: undefined,
    },
  });

  // Reset form when dialog opens or circle changes
  useEffect(() => {
    if (open) {
      if (circle) {
        form.reset({
          name: circle.name,
          description: circle.description || "",
          gender: circle.gender,
          teacherId: circle.teacherId, // Note: teacherId might be undefined if not loaded fully or if teacher was deleted
        });
      } else {
        form.reset({
          name: "",
          description: "",
          gender: undefined,
          teacherId: undefined,
        });
      }
    }
  }, [open, circle, form]);

  /**
   * Handle form submission
   * Creates or updates a circle and closes the dialog on success
   */
  const onSubmit = async (data: CreateCircleFormData) => {
    try {
      if (isEditMode && circle) {
        await updateMutation.mutateAsync({
          id: circle.id,
          data: {
            name: data.name,
            description: data.description,
            gender: data.gender,
            teacherId: data.teacherId,
          },
        });
        toast({
          title: t("updateSuccessTitle"),
          description: t("updateSuccessDesc", { name: data.name }),
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          gender: data.gender,
          teacherId: data.teacherId,
        });
        toast({
          title: t("successTitle"),
          description: t("successDesc", { name: data.name }),
        });
      }

      setOpen?.(false);
      form.reset();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditMode
            ? t("updateErrorDesc")
            : t("errorDesc");

      toast({
        variant: "destructive",
        title: t("errorTitle"),
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {children || (
            <Button>
              <Plus className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
              {t("newCircleBtn")}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editDialogTitle") : t("createDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDialogDesc") : t("createDialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Circle Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teacher Selection */}
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("teacherLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isLoading || teachersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            teachersLoading
                              ? t("loadingTeachers")
                              : t("selectTeacher")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.length === 0 && !teachersLoading ? (
                        <SelectItem value="_none" disabled>
                          {t("noTeachers")}
                        </SelectItem>
                      ) : (
                        teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender Selection */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("genderLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectGender")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">{t("male")}</SelectItem>
                      <SelectItem value="FEMALE">{t("female")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (Optional) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      disabled={isLoading}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex justify-between flex-col gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 rtl:ml-2 ltr:mr-2 animate-spin" />
                      {isEditMode ? t("updating") : t("creating")}
                    </>
                  ) : isEditMode ? (
                    t("updateCircle")
                  ) : (
                    t("createCircle")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen?.(false)}
                  disabled={isLoading}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

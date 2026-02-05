"use client";

/**
 * CreateTeacherDialog Component
 *
 * Dialog for creating a new teacher account.
 * Includes required fields: name, email, phone, and password.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { useCreateTeacher, useUserProfile } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

// Validation schema defined in component for translations

interface CreateTeacherDialogProps {
  /** Optional custom trigger button */
  children?: React.ReactNode;
}

/**
 * Dialog component for creating new teacher accounts
 *
 * @example
 * ```tsx
 * <CreateTeacherDialog />
 * // Or with custom trigger
 * <CreateTeacherDialog>
 *   <Button>Add Teacher</Button>
 * </CreateTeacherDialog>
 * ```
 */
export function CreateTeacherDialog({ children }: CreateTeacherDialogProps) {
  const t = useTranslations("Teachers");
  const tCommon = useTranslations("Common");
  const tAuth = useTranslations("Auth");

  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateTeacher();
  const { data: profile } = useUserProfile();

  /**
   * Validation schema for teacher creation
   */
  const createTeacherSchema = z.object({
    fullName: z
      .string()
      .min(
        2,
        t("nameLimit", { defaultValue: "Name must be at least 2 characters" }),
      ),
    email: z.string().email(tAuth("validEmail")),
    phoneNumber: z.string().min(
      10,
      t("phoneLimit", {
        defaultValue: "Phone number must be at least 10 digits",
      }),
    ),
    password: z.string().min(6, tAuth("passwordMinLength")),
  });

  type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;

  const form = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  /**
   * Handle form submission
   * Creates a new teacher and closes the dialog on success
   */
  const onSubmit = async (data: CreateTeacherFormData) => {
    try {
      await createMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        mosqueId: (profile as any)?.mosqueId || undefined,
      });

      toast({
        title: t("teacherCreated"),
        description: t("teacherCreatedDescription", { name: data.fullName }),
      });

      setOpen(false);
      form.reset();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create teacher. Please try again.";

      toast({
        variant: "destructive",
        title: t("createFailed"),
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            {t("addTeacher")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addNewTeacher")}</DialogTitle>
          <DialogDescription>{t("createTeacherDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fullName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phoneNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={t("phonePlaceholder")}
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("passwordPlaceholder")}
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex justify-between flex-col gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    t("addTeacher")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={createMutation.isPending}
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

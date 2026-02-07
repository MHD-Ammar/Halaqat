"use client";

/**
 * Edit User Dialog
*
* Modal dialog for editing user details (Admin only).
* Allows updating fullName, email, phoneNumber, and role.
*/

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { useUpdateUser, type User } from "@/hooks/use-users";

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Roles available for selection
 */
const ROLES = ["ADMIN", "SUPERVISOR", "TEACHER", "EXAMINER"] as const;

export function EditUserDialog({
  open,
  user,
  onOpenChange,
}: EditUserDialogProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");

  // Validation schema
  const editUserSchema = z.object({
    fullName: z.string().min(2, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    phoneNumber: z
      .string()
      .min(10, t("phoneMinLength"))
      .regex(/^[0-9+\-\s()]+$/, tCommon("phoneInvalid")),
    role: z.enum(ROLES),
  });

  type EditUserFormData = z.infer<typeof editUserSchema>;

  const updateMutation = useUpdateUser();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "TEACHER",
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        role: (user.role as (typeof ROLES)[number]) || "TEACHER",
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      await updateMutation.mutateAsync({
        id: user.id,
        ...data,
      });

      toast({
        title: tCommon("success"),
        description: t("userUpdated"),
      });

      onOpenChange(false);
    } catch (error: any) {
      const message = error.response?.data?.message || tCommon("error");
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: message,
      });
    }
  };

  /**
   * Translate role for display
   */
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      ADMIN: t("roleAdmin"),
      SUPERVISOR: t("roleSupervisor"),
      TEACHER: t("roleTeacher"),
      EXAMINER: t("roleExaminer"),
    };
    return roleLabels[role] || role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t("editUser")}
          </DialogTitle>
          <DialogDescription>{t("editUserDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fullNamePlaceholder")}
                      disabled={updateMutation.isPending}
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
                  <FormLabel>{tCommon("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="user@example.com"
                      disabled={updateMutation.isPending}
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
                  <FormLabel>{tCommon("phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="+966 50 123 4567"
                      disabled={updateMutation.isPending}
                      {...field}
                      onChange={(e) => {
                        // Only allow digits, +, -, spaces, and parentheses
                        const value = e.target.value.replace(
                          /[^0-9+\-\s()]/g,
                          ""
                        );
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectRole")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex sm:justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {tCommon("save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

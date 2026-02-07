"use client";

/**
 * CreateUserDialog Component
 *
 * Dialog for creating a new user account with role selection.
 * Includes required fields: name, email, phone, password, and role.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserProfile } from "@/hooks";
import { useCreateUser } from "@/hooks/use-create-user";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["ADMIN", "SUPERVISOR", "TEACHER", "EXAMINER"] as const;

interface CreateUserDialogProps {
  /** Optional custom trigger button */
  children?: React.ReactNode;
}

/**
 * Dialog component for creating new user accounts
 */
export function CreateUserDialog({ children }: CreateUserDialogProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tAuth = useTranslations("Auth");
  const tRoles = useTranslations("Roles");

  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateUser();
  const { data: profile } = useUserProfile();

  /**
   * Validation schema for user creation
   */
  const createUserSchema = z.object({
    fullName: z.string().min(2, t("nameMinLength")),
    email: z.string().email(tAuth("validEmail")),
    phoneNumber: z
      .string()
      .min(10, t("phoneMinLength"))
      .regex(/^[0-9+\-\s()]+$/, t("phoneInvalid")),
    password: z.string().min(6, tAuth("passwordMinLength")),
    role: z.enum(ROLES, { message: t("selectRole") }),
  });

  type CreateUserFormData = z.infer<typeof createUserSchema>;

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: undefined,
    },
  });

  /**
   * Handle form submission
   * Creates a new user and closes the dialog on success
   */
  const onSubmit = async (data: CreateUserFormData) => {
    try {
      await createMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: data.role,
        mosqueId: profile?.mosqueId || undefined,
      });

      toast({
        title: t("userCreated"),
        description: t("userCreatedDescription", { name: data.fullName }),
      });

      setOpen(false);
      form.reset();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("createFailed");

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
            <UserPlus className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {t("addUser")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addNewUser")}</DialogTitle>
          <DialogDescription>{t("createUserDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
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
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9+\-\s()]*"
                      placeholder={t("phonePlaceholder")}
                      disabled={createMutation.isPending}
                      {...field}
                      onChange={(e) => {
                        // Only allow digits, +, -, spaces, and parentheses
                        const value = e.target.value.replace(/[^0-9+\-\s()]/g, "");
                        field.onChange(value);
                      }}
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

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={createMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectRole")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {tRoles(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex justify-between flex-col gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 rtl:ml-2 ltr:mr-2 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    t("addUser")
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

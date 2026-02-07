"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Lock } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useResetPassword, type User } from "@/hooks/use-users";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordDialogProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  open,
  user,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ password: "" });
    }
  }, [open, form]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return;

    try {
      await resetPasswordMutation.mutateAsync({
        userId: user.id,
        password: data.password,
      });

      toast({
        title: tCommon("success"),
        description: t("passwordResetSuccess") || "Password reset successfully",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: tCommon("error"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("resetPassword") || "Reset Password"}
          </DialogTitle>
          <DialogDescription>
            {t("resetPasswordDesc", { name: user?.fullName || "" })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword") || "New Password"}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={t("enterNewPassword") || "Enter new password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? (
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

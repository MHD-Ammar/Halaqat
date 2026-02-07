"use client";

/**
 * Edit Student Dialog
 *
 * Modal dialog for editing student details.
 * Includes all student fields with proper validation.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCircles } from "@/hooks/use-circles";
import {
  useUpdateStudent,
  type Student,
} from "@/hooks/use-students";
import { toast } from "@/hooks/use-toast";




interface EditStudentDialogProps {
  open: boolean;
  student: Student | null;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({
  open,
  student,
  onOpenChange,
}: EditStudentDialogProps) {
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Validation schema
  const editStudentSchema = z.object({
    name: z.string().min(2, t("nameRequired")),
    phone: z.string().optional().or(z.literal("")),
    dob: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    guardianName: z.string().optional().or(z.literal("")),
    guardianPhone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[0-9+\-\s()]*$/.test(val),
        tCommon("phoneInvalid") || "Invalid phone format",
      ),
    circleId: z.string().min(1, t("circleRequired")),
  });

  type EditStudentFormData = z.infer<typeof editStudentSchema>;

  const updateMutation = useUpdateStudent();
  const { data: circles = [], isLoading: circlesLoading } = useCircles({
    enabled: open,
  });

  const form = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: "",
      phone: "",
      dob: "",
      address: "",
      notes: "",
      guardianName: "",
      guardianPhone: "",
      circleId: "",
    },
  });

  // Reset form when student changes
  useEffect(() => {
    if (student && open) {
      form.reset({
        name: student.name || "",
        phone: (student as any).phone || "",
        dob: student.dateOfBirth?.split("T")[0] || "",
        address: (student as any).address || "",
        notes: (student as any).notes || "",
        guardianName: student.guardianName || "",
        guardianPhone: student.guardianPhone || "",
        circleId: student.circleId || "",
      });
    }
  }, [student, open, form]);

  const onSubmit = async (data: EditStudentFormData) => {
    if (!student) return;

    try {
      await updateMutation.mutateAsync({
        id: student.id,
        ...data,
      });

      toast({
        title: tCommon("success"),
        description: t("studentUpdated"),
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

  // Password reset state - Temporarily disabled
  // const [password, setPassword] = useState("");
  // const [showPasswordInput, setShowPasswordInput] = useState(false);
  // const resetPasswordMutation = useResetPassword();
  // const generateCredentialsMutation = useGenerateCredentials();

  // const handleResetPassword = async () => { ... }
  // const handleGenerateCredentials = async () => { ... }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t("editStudent")}
          </DialogTitle>
          <DialogDescription>{t("editStudentDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[400px]" dir={dir}>
              <div className="space-y-6 px-4">
                {/* Student Information Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {t("studentInfo")}
                  </h4>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon("name")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("namePlaceholder")}
                            disabled={updateMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Circle */}
                  <FormField
                    control={form.control}
                    name="circleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("circle")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={updateMutation.isPending || circlesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectCircle")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {circles.map((circle) => (
                              <SelectItem key={circle.id} value={circle.id}>
                                {circle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
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
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9+\-\s()]/g,
                                "",
                              );
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("dateOfBirth")}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={updateMutation.isPending}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("address")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("addressPlaceholder")}
                            disabled={updateMutation.isPending}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("notes")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("notesPlaceholder")}
                            disabled={updateMutation.isPending}
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Guardian Information Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {t("guardianInfo")}
                  </h4>

                  {/* Guardian Name */}
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("guardianName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("guardianNamePlaceholder")}
                            disabled={updateMutation.isPending}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Guardian Phone */}
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("guardianPhone")}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            placeholder="+966 50 123 4567"
                            disabled={updateMutation.isPending}
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9+\-\s()]/g,
                                "",
                              );
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Credentials Section - Temporarily Disabled */}
                {/* 
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t("loginCredentials") || "Login Credentials"}
                  </h4>
                  
                  ... (rest of the code)
                
                </div>
                
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t("loginCredentials") || "Login Credentials"}
                  </h4>

                  {student?.userId ? (
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t("username") || "Username"}:
                        </span>
                        <span className="font-medium font-mono">
                          {student.username || "student_..."}
                        </span>
                      </div>

                      {showPasswordInput ? (
                        <div className="space-y-2">
                          <label className="text-xs font-medium">
                            {t("newPassword") || "New Password"}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t("enterNewPassword") || "Enter new password"}
                              className="h-9"
                            />
                            <Button
                              type="button"
                              onClick={handleResetPassword}
                              disabled={!password || resetPasswordMutation.isPending}
                              size="sm"
                            >
                              {resetPasswordMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                tCommon("save")
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowPasswordInput(false)}
                              size="sm"
                            >
                              {tCommon("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswordInput(true)}
                          className="w-full"
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          {t("resetPassword") || "Reset Password"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border p-4 bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-2 rounded-full bg-background border">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("noCredentialsDesc") ||
                          "This student does not have login credentials yet."}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleGenerateCredentials}
                        disabled={generateCredentialsMutation.isPending}
                      >
                        {generateCredentialsMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="mr-2 h-4 w-4" />
                        )}
                        {t("generateCredentials") || "Generate Credentials"}
                      </Button>
                    </div>
                  )}
                </div>
                */}
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 mt-4 border-t flex sm:justify-start gap-2">
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

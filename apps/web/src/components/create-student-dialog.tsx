"use client";

/**
 * CreateStudentDialog Component
 *
 * Dialog for adding a new student with circle selection.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useCircles,
  useMyCircles,
  useCreateStudent,
  useAuth,
  useCircle,
} from "@/hooks";

interface CreateStudentDialogProps {
  children?: React.ReactNode;
  defaultCircleId?: string;
}

export function CreateStudentDialog({
  children,
  defaultCircleId,
}: CreateStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isTeacher } = useAuth();
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");

  const isUuid = (val: any): val is string =>
    typeof val === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      val,
    );

  // Validation schema
  const createStudentSchema = z.object({
    name: z.string().min(2, t("nameRequired")),
    circleId: z.string(t("circleRequired")),
    guardianName: z.string().optional().or(z.literal("")),
    guardianPhone: z.string().optional().or(z.literal("")),
  });

  type CreateStudentFormData = z.infer<typeof createStudentSchema>;

  // Data fetching - unified logic
  const { data: adminCircles = [], isLoading: adminCirclesLoading } =
    useCircles({
      enabled: !!(open && isAdmin && !isUuid(defaultCircleId)),
    });

  const { data: teacherCircles = [], isLoading: teacherCirclesLoading } =
    useMyCircles({
      enabled: !!(open && isTeacher && !isUuid(defaultCircleId)),
    });

  const { data: defaultCircle, isLoading: defaultCircleLoading } = useCircle(
    defaultCircleId,
    { enabled: !!(open && isUuid(defaultCircleId)) },
  );

  // Derive available circles list
  const circles = isUuid(defaultCircleId)
    ? defaultCircle
      ? [defaultCircle]
      : []
    : isAdmin
      ? adminCircles
      : teacherCircles;

  const circlesLoading =
    adminCirclesLoading || teacherCirclesLoading || defaultCircleLoading;

  const createMutation = useCreateStudent();

  const form = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: "",
      circleId: isUuid(defaultCircleId) ? defaultCircleId : "",
      guardianName: "",
      guardianPhone: "",
    },
  });

  const currentCircleId = form.watch("circleId");
  const selectedCircle = circles.find((c) => c.id === currentCircleId);

  // Sync circle selection
  useEffect(() => {
    if (!open) return;

    // Case 1: Explicit default circle provided (e.g. from Dashboard button)
    if (isUuid(defaultCircleId)) {
      if (currentCircleId !== defaultCircleId) {
        form.setValue("circleId", defaultCircleId, { shouldValidate: true });
      }
      return;
    }

    // Case 2: Only one choice available (e.g. Teacher with 1 circle or small Mosque)
    if (!circlesLoading && circles.length === 1 && !currentCircleId) {
      const singleCircle = circles[0];
      if (singleCircle) {
        form.setValue("circleId", singleCircle.id, { shouldValidate: true });
      }
    }
  }, [open, circles, circlesLoading, defaultCircleId, currentCircleId, form]);

  const onSubmit = async (data: CreateStudentFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: t("studentAdded"),
        description: t("studentAddedDesc", { name: data.name }),
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      const message = error.response?.data?.message || tCommon("error");
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: message,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const isSubmitDisabled =
    createMutation.isPending || circlesLoading || !currentCircleId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("addStudent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addStudent")}</DialogTitle>
          <DialogDescription>
            {selectedCircle
              ? `${tCommon("add")} -> ${selectedCircle.name}`
              : tCommon("add")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Validation failed:", errors);
              const firstError =
                Object.values(errors)[0]?.message || tCommon("error");
              toast({
                variant: "destructive",
                title: tCommon("error"),
                description: firstError as string,
              });
            })}
            className="space-y-4"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tCommon("name")}
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Circle Area: Logic-driven UI */}
            {circlesLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted/50 animate-pulse rounded" />
                <div className="h-10 w-full bg-muted/30 animate-pulse rounded border border-dashed" />
              </div>
            ) : circles.length > 1 && !isUuid(defaultCircleId) ? (
              /* Dropdown only shown if there are actually multiple choices */
              <FormField
                control={form.control}
                name="circleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("selectCircle")}</FormLabel>
                    <Popover open={circleOpen} onOpenChange={setCircleOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={circleOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={createMutation.isPending}
                          >
                            {selectedCircle?.name || t("selectCircle")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder={tCommon("search")} />
                          <CommandList>
                            <CommandEmpty>{tCommon("noData")}</CommandEmpty>
                            <CommandGroup>
                              {circles.map((circle) => (
                                <CommandItem
                                  key={circle.id}
                                  value={circle.name}
                                  onSelect={() => {
                                    form.setValue("circleId", circle.id, {
                                      shouldValidate: true,
                                    });
                                    setCircleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === circle.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {circle.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : selectedCircle ? (
              /* If unique or pre-selected, show a helpful summary box instead of an active input */
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between shadow-sm transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {t("selectCircle")}
                  </span>
                </div>
                <span className="font-bold text-primary text-sm">
                  {selectedCircle.name}
                </span>
              </div>
            ) : null}

            {/* Guardian Name */}
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("guardianName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("guardianName")}
                      disabled={createMutation.isPending}
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
                      placeholder="+123..."
                      disabled={createMutation.isPending}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t">
              {!form.formState.isValid && form.formState.isSubmitted && (
                <p className="text-xs text-destructive text-center sm:text-left mb-2 sm:mb-0 w-full">
                  {tCommon("error")}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="min-w-[100px]"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  tCommon("add")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

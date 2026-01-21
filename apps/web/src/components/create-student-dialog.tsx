"use client";

/**
 * CreateStudentDialog Component
 *
 * Dialog for adding a new student with circle selection.
 */

import { useState } from "react";
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
import { useCircles, useCreateStudent } from "@/hooks";

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
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");

  // Validation schema defined in component for translations
  const createStudentSchema = z.object({
    name: z.string().min(2, tCommon("error")),
    circleId: z.string().min(1, tCommon("error")),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
  });

  type CreateStudentFormData = z.infer<typeof createStudentSchema>;

  const { data: circles = [], isLoading: circlesLoading } = useCircles();
  const createMutation = useCreateStudent();

  const form = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: "",
      circleId: defaultCircleId || "",
      guardianName: "",
      guardianPhone: "",
    },
  });

  const selectedCircle = circles.find((c) => c.id === form.watch("circleId"));

  const onSubmit = async (data: CreateStudentFormData) => {
    try {
      await createMutation.mutateAsync(data);

      toast({
        title: tCommon("success"),
        description: tCommon("success"),
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogDescription>{tCommon("add")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Circle Selection - only show if no defaultCircleId */}
            {!defaultCircleId && (
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
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={
                              circlesLoading || createMutation.isPending
                            }
                          >
                            {circlesLoading
                              ? tCommon("loading")
                              : selectedCircle?.name || t("selectCircle")}
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
                                    field.onChange(circle.id);
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
            )}

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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
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

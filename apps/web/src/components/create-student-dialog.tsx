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

// Validation schema
const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  circleId: z.string().min(1, "Please select a circle"),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

type CreateStudentFormData = z.infer<typeof createStudentSchema>;

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
        title: "Student added!",
        description: `${data.name} has been added successfully.`,
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to add student";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Add a new student to a study circle.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter student name"
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
                    <FormLabel>Circle</FormLabel>
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
                              ? "Loading circles..."
                              : selectedCircle?.name || "Select a circle..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search circles..." />
                          <CommandList>
                            <CommandEmpty>No circles found.</CommandEmpty>
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
                  <FormLabel>Guardian Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Parent/guardian name"
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
                  <FormLabel>Guardian Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., +1234567890"
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
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

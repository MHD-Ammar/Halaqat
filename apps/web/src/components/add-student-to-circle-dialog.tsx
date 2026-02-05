"use client";

/**
 * AddStudentToCircleDialog Component
 *
 * A searchable dialog for adding existing unassigned students to a circle.
 * Uses Command (cmdk) for search-as-you-type functionality.
 */

import { UserPlus, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAssignStudentToCircle } from "@/hooks/use-assign-student-to-circle";
import { useToast } from "@/hooks/use-toast";
import { useUnassignedStudents } from "@/hooks/use-unassigned-students";

interface AddStudentToCircleDialogProps {
  /** The circle ID to add students to */
  circleId: string;
  /** Optional custom trigger button */
  children?: React.ReactNode;
}

/**
 * Dialog component for adding existing students to a circle
 *
 * Features:
 * - Search-as-you-type with debounce
 * - Shows only unassigned students
 * - Click to assign immediately
 */
export function AddStudentToCircleDialog({
  circleId,
  children,
}: AddStudentToCircleDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: students = [],
    isLoading,
  } = useUnassignedStudents(debouncedSearch);

  const assignMutation = useAssignStudentToCircle();

  /**
   * Handle student selection - assign to circle
   */
  const handleSelect = async (studentId: string, studentName: string) => {
    try {
      await assignMutation.mutateAsync({
        studentId,
        circleId,
      });

      toast({
        title: "Student added!",
        description: `${studentName} has been added to this circle.`,
      });

      setOpen(false);
      setSearch("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add student. Please try again.";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Student to Circle
          </DialogTitle>
          <DialogDescription>
            Search for students not yet assigned to any circle.
          </DialogDescription>
        </DialogHeader>
        <Command className="border-t" shouldFilter={false}>
          <CommandInput
            placeholder="Search by name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">
                  Searching...
                </p>
              </div>
            ) : students.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch
                  ? "No unassigned students found."
                  : "Type to search for students..."}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Unassigned Students">
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={student.id}
                    onSelect={() => handleSelect(student.id, student.name)}
                    disabled={assignMutation.isPending}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        {student.guardianName && (
                          <p className="text-xs text-muted-foreground truncate">
                            Guardian: {student.guardianName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

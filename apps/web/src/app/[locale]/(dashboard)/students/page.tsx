"use client";

/**
 * Students Page
 *
 * Admin/Teacher view for managing students.
 * Features: List students with pagination, add new students, view details, edit, delete.
 */

import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CreateStudentDialog } from "@/components/create-student-dialog";
import { EditStudentDialog } from "@/components/edit-student-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents, useDeleteStudent, type Student } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/routing";

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  const { data, isLoading, isError } = useStudents({ page, limit });
  const deleteStudentMutation = useDeleteStudent();

  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    await deleteStudentMutation.mutateAsync(selectedStudent.id);
    setDeleteDialogOpen(false);
    toast({
      title: t("studentDeleted"),
      description: t("deleteSuccess"),
    });
  };



  const students = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Filter by search (client-side for now)
  const filteredStudents = searchTerm
    ? students.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {tCommon("error")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("totalStudents", { count: total })}
          </p>
        </div>
        <CreateStudentDialog />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tCommon("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-start"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {getInitials(student.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {student.name}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {/* Circle */}
                      {student.circle && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{student.circle.name}</span>
                        </div>
                      )}
                      {/* Guardian Info */}
                      {student.guardianName && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {student.guardianName}
                            {student.guardianPhone &&
                              ` (${student.guardianPhone})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points Badge */}
                  {student.totalPoints !== undefined && (
                    <Badge variant="secondary" className="font-mono">
                      {student.totalPoints} {tCommon("points")}
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(student)}
                      title={t("editStudent")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(student)}
                      title={t("deleteStudent")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg mb-2">{t("noStudents")}</CardTitle>
            <CardDescription className="text-center mb-4">
              {t("noStudentsDesc")}
            </CardDescription>
            <CreateStudentDialog />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 me-2" />
            {tCommon("back")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tCommon("page")} {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {tCommon("next")}
            <ChevronRight className="h-4 w-4 ms-2" />
          </Button>
        </div>
      )}

      {/* Edit Student Dialog */}
      <EditStudentDialog
        open={editDialogOpen}
        student={selectedStudent}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("deleteStudent")}
        description={t("deleteConfirmation", {
          name: selectedStudent?.name || "",
        })}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
        isPending={deleteStudentMutation.isPending}
        onConfirm={handleConfirmDelete}
        confirmLabel={t("deleteStudent")}
      />
    </div>
  );
}


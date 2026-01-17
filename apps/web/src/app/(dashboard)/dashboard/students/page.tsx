"use client";

/**
 * Students Page
 *
 * Admin/Teacher view for managing students.
 * Features: List students with pagination, add new students, view details.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreateStudentDialog } from "@/components/create-student-dialog";
import { useStudents } from "@/hooks";

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

  const { data, isLoading, isError } = useStudents({ page, limit });

  const students = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Filter by search (client-side for now)
  const filteredStudents = searchTerm
    ? students.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

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
            Failed to load students. Please try again.
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
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            {total} student{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <CreateStudentDialog />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
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
                    {student.circle && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {student.circle.name}
                      </div>
                    )}
                  </div>

                  {/* Points Badge */}
                  {student.totalPoints !== undefined && (
                    <Badge variant="secondary" className="font-mono">
                      {student.totalPoints} pts
                    </Badge>
                  )}
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
            <CardTitle className="text-lg mb-2">No students yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Add students to your circles to track their progress
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
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

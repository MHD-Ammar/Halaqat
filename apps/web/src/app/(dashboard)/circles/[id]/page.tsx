"use client";

/**
 * Circle Details Page
 *
 * Displays detailed information about a single study circle
 * including assigned teacher and list of students.
 */

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddStudentToCircleDialog } from "@/components/add-student-to-circle-dialog";
import { useCircle } from "@/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CircleDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: circle, isLoading, isError } = useCircle(id);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (isError || !circle) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Failed to load circle details. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/circles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
          {circle.description && (
            <p className="text-muted-foreground">{circle.description}</p>
          )}
        </div>
      </div>

      {/* Circle Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Circle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gender</span>
              <Badge variant="secondary">
                {circle.gender === "MALE" ? "Male" : "Female"}
              </Badge>
            </div>
            {circle.location && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{circle.location}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Students</span>
              <span className="font-medium">
                {circle.students?.length || circle._count?.students || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            {circle.teacher ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {getInitials(circle.teacher.fullName)}
                </div>
                <div>
                  <p className="font-medium">{circle.teacher.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {circle.teacher.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No teacher assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({circle.students?.length || 0})
          </CardTitle>
          <AddStudentToCircleDialog circleId={id} />
        </CardHeader>
        <CardContent>
          {circle.students && circle.students.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circle.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                            {getInitials(student.name)}
                          </div>
                          <Link
                            href={`/students/${student.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {student.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {student.totalPoints || 0} pts
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students in this circle yet.</p>
              <p className="text-sm">Add students to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

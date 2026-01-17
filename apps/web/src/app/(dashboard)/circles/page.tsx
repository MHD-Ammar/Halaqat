"use client";

/**
 * Circles Page
 *
 * Admin view for managing study circles.
 * Features: List circles, create new circles, view circle details.
 */

import Link from "next/link";
import { BookOpen, Users, MoreVertical, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCircleDialog } from "@/components/create-circle-dialog";
import { useCircles, useDeleteCircle } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

export default function CirclesPage() {
  const { data: circles, isLoading, isError } = useCircles();
  const deleteMutation = useDeleteCircle();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Circle deleted",
        description: `${name} has been removed.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete circle.",
      });
    }
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
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
            Failed to load circles. Please try again.
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
          <h1 className="text-2xl font-bold text-foreground">My Circles</h1>
          <p className="text-muted-foreground">Manage your study circles</p>
        </div>
        <CreateCircleDialog />
      </div>

      {/* Circles Grid */}
      {circles && circles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
            <Card
              key={circle.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        href={`/circles/${circle.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {circle.name}
                      </Link>
                      {circle.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {circle.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(circle.id, circle.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{circle._count?.students || 0} students</span>
                  </div>
                  {circle.teacher && (
                    <span>Teacher: {circle.teacher.fullName}</span>
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
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg mb-2">No circles yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Create your first study circle to get started
            </CardDescription>
            <CreateCircleDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

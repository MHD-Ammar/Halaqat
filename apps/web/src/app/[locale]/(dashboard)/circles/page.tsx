"use client";

/**
 * Circles Page
 *
 * Admin view for managing study circles.
 * Features: List circles, create new circles, view circle details.
 */

import { BookOpen, Users, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CreateCircleDialog } from "@/components/create-circle-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCircles, useDeleteCircle, useAuth } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/routing";

export default function CirclesPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const {
    data: circles,
    isLoading,
    isError,
  } = useCircles({ enabled: isAdmin });
  const deleteMutation = useDeleteCircle();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("Circles");
  const tCommon = useTranslations("Common");
  const [circleToDelete, setCircleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Protect the page - redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/overview");
    }
  }, [isAdmin, authLoading, router]);

  if (authLoading) return null;

  const handleDeleteClick = (id: string, name: string) => {
    setCircleToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!circleToDelete) return;

    try {
      await deleteMutation.mutateAsync(circleToDelete.id);
      toast({
        title: tCommon("success"),
        description: tCommon("delete") + " " + circleToDelete.name,
      });
      setDeleteDialogOpen(false);
      setCircleToDelete(null);
    } catch {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: tCommon("error"),
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
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <CreateCircleDialog />
      </div>

      {/* Circles Grid */}
      {circles && circles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
            <Card key={circle.id} className="hover:shadow-md transition-shadow">
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
                        onClick={() => handleDeleteClick(circle.id, circle.name)}
                      >
                        <Trash2 className="h-4 w-4 me-2" />
                        {t("deleteCircle")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {circle.studentCount || 0}{" "}
                      {tCommon("students")}
                    </span>
                  </div>
                  {circle.teacher && <span>{circle.teacher.fullName}</span>}
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
            <CardTitle className="text-lg mb-2">{t("noCircles")}</CardTitle>
            <CardDescription className="text-center mb-4">
              {t("noCirclesDesc")}
            </CardDescription>
            <CreateCircleDialog />
          </CardContent>
        </Card>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCircle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmation")}
              {circleToDelete && ` (${circleToDelete.name})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { QuestCategory } from "@halaqat/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { DataTable } from "@/components/shared/data-table";
import { GenericDialog } from "@/components/shared/generic-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminAchievements,
  useCreateAchievement,
  useUpdateAchievement,
  useDeleteAchievement,
  type Achievement,
  type AchievementCriteriaType,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";

const CRITERIA_TYPES: AchievementCriteriaType[] = [
  "STREAK_DAYS",
  "TOTAL_XP",
  "TOTAL_QUESTS_CATEGORY",
];

const achievementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(2, "Description is required"),
  badgeIcon: z.string().min(1, "Icon/URL is required"),
  criteriaType: z.enum(["STREAK_DAYS", "TOTAL_XP", "TOTAL_QUESTS_CATEGORY"] as const),
  criteriaTarget: z.number().min(1, "Target must be at least 1"),
  criteriaCategory: z.nativeEnum(QuestCategory).nullable().optional(),
  rarity: z.enum(["COMMON", "RARE", "EPIC", "LEGENDARY"]),
}).refine(
  (data) => {
    // If criteria type requires a category, ensure it's provided
    if (data.criteriaType === "TOTAL_QUESTS_CATEGORY" && !data.criteriaCategory) {
      return false;
    }
    return true;
  },
  {
    message: "Category is required for 'TOTAL_QUESTS_CATEGORY' criteria",
    path: ["criteriaCategory"],
  }
);

type AchievementFormValues = z.infer<typeof achievementSchema>;

export function AchievementsTab() {
  const t = useTranslations("GamificationHub.achievements");
  const { data: achievements = [], isLoading } = useAdminAchievements();
  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<string | null>(null);

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: "",
      description: "",
      badgeIcon: "🏆",
      criteriaType: "TOTAL_XP",
      criteriaTarget: 1000,
      criteriaCategory: null,
      rarity: "COMMON",
    },
  });

  const selectedCriteriaType = form.watch("criteriaType");

  const handleOpenCreate = () => {
    setEditingAchievement(null);
    form.reset({
      title: "",
      description: "",
      badgeIcon: "🏆",
      criteriaType: "TOTAL_XP",
      criteriaTarget: 1000,
      criteriaCategory: null,
      rarity: "COMMON",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    form.reset({
      title: achievement.title,
      description: achievement.description,
      badgeIcon: achievement.badgeIcon,
      criteriaType: achievement.criteriaType,
      criteriaTarget: achievement.criteriaTarget,
      criteriaCategory: achievement.criteriaCategory || null,
      rarity: achievement.rarity || "COMMON",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: AchievementFormValues) => {
    try {
      // Clean up category if not applicable
      const sanitizedValues = {
        ...values,
        criteriaCategory: values.criteriaType === "TOTAL_QUESTS_CATEGORY" ? values.criteriaCategory : null,
      };

      if (editingAchievement) {
        await updateAchievement.mutateAsync({ id: editingAchievement.id, dto: sanitizedValues });
        toast({ title: t("toast.updated") });
      } else {
        await createAchievement.mutateAsync(sanitizedValues);
        toast({ title: t("toast.created") });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: t("toast.operationFailed"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!achievementToDelete) return;
    try {
      await deleteAchievement.mutateAsync(achievementToDelete);
      toast({ title: t("toast.deleted") });
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    }
  };

  const columns = [
    {
      header: t("columns.icon"),
      cell: (row: Achievement) => <span className="text-2xl">{row.badgeIcon}</span>,
    },
    {
      header: t("columns.title"),
      accessorFn: (row: Achievement) => row.title,
      className: "font-medium",
    },
    {
      header: t("columns.criteria"),
      cell: (row: Achievement) => (
        <Badge variant="outline">{row.criteriaType.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      header: t("columns.target"),
      cell: (row: Achievement) => (
        <span>
          {row.criteriaTarget}
          {row.criteriaCategory && ` (${row.criteriaCategory})`}
        </span>
      ),
    },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (row: Achievement) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleOpenEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              setAchievementToDelete(row.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t("createBtn")}
        </Button>
      </div>

      <DataTable
        data={achievements}
        columns={columns}
        isLoading={isLoading}
        emptyState={{
          title: t("emptyState.title"),
          description: t("emptyState.description"),
        }}
      />

      <GenericDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingAchievement ? t("editTitle") : t("createTitle")}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.description")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.descPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="badgeIcon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.icon")}</FormLabel>
                    <FormControl>
                      <Input placeholder="🔥" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="criteriaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.criteriaType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.selectType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRITERIA_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="criteriaTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.goalTarget")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.goalTargetDesc")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedCriteriaType === "TOTAL_QUESTS_CATEGORY" && (
                <FormField
                  control={form.control}
                  name="criteriaCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.questCategoryFocus")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.selectCategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(QuestCategory).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.rarity")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.selectRarity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMMON">{t("form.rarity_common")}</SelectItem>
                        <SelectItem value="RARE">{t("form.rarity_rare")}</SelectItem>
                        <SelectItem value="EPIC">{t("form.rarity_epic")}</SelectItem>
                        <SelectItem value="LEGENDARY">{t("form.rarity_legendary")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createAchievement.isPending || updateAchievement.isPending}>
                {editingAchievement ? t("form.save") : t("form.create")}
              </Button>
            </div>
          </form>
        </Form>
      </GenericDialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={handleDelete}
        isPending={deleteAchievement.isPending}
      />
    </div>
  );
}

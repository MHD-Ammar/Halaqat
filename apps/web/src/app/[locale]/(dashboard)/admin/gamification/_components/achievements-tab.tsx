"use client";

import { QuestCategory } from "@halaqat/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CrudDialog } from "@/components/ui/crud-dialog";
import { NumberField, SelectField, TextField } from "@/components/ui/form-fields";
import {
  useAdminAchievements,
  useCreateAchievement,
  useDeleteAchievement,
  useUpdateAchievement,
  type Achievement,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";
import {
  createAchievementSchema,
  CRITERIA_TYPES,
  RARITY_LABELS,
  RARITY_TYPES,
  type CreateAchievementInput,
} from "@/lib/schemas/achievement";

const CRITERIA_OPTIONS = CRITERIA_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }));
const RARITY_OPTIONS = RARITY_TYPES.map((r) => ({ value: r, label: RARITY_LABELS[r] }));
const CATEGORY_OPTIONS = Object.values(QuestCategory).map((c) => ({ value: c, label: c }));

const EMPTY_DEFAULTS: CreateAchievementInput = {
  title: "",
  description: "",
  badgeIcon: "🏆",
  criteriaType: "TOTAL_XP",
  criteriaTarget: 1000,
  criteriaCategory: null,
  rarity: "COMMON",
};

function achievementToDefaults(a: Achievement): CreateAchievementInput {
  return {
    title: a.title,
    description: a.description,
    badgeIcon: a.badgeIcon,
    criteriaType: a.criteriaType,
    criteriaTarget: a.criteriaTarget,
    criteriaCategory: a.criteriaCategory ?? null,
    rarity: a.rarity ?? "COMMON",
  };
}

export function AchievementsTab() {
  const t = useTranslations("GamificationHub.achievements");
  const { data: achievements = [], isLoading } = useAdminAchievements();
  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => { setEditingAchievement(null); setDialogOpen(true); };
  const handleOpenEdit = (a: Achievement) => { setEditingAchievement(a); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!achievementToDelete) return;
    try {
      await deleteAchievement.mutateAsync(achievementToDelete);
      toast({ title: t("toast.deleted") });
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    }
  };

  const columns = [
    { header: t("columns.icon"), cell: (r: Achievement) => <span className="text-2xl">{r.badgeIcon}</span> },
    { header: t("columns.title"), accessorFn: (r: Achievement) => r.title, className: "font-medium" },
    {
      header: t("columns.criteria"),
      cell: (r: Achievement) => <Badge variant="outline">{r.criteriaType.replace(/_/g, " ")}</Badge>,
    },
    {
      header: t("columns.target"),
      cell: (r: Achievement) => (
        <span>{r.criteriaTarget}{r.criteriaCategory && ` (${r.criteriaCategory})`}</span>
      ),
    },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (r: Achievement) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => { setAchievementToDelete(r.id); setDeleteDialogOpen(true); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t("createBtn")}
        </Button>
      </div>

      <DataTable
        data={achievements}
        columns={columns}
        isLoading={isLoading}
        emptyState={{ title: t("emptyState.title"), description: t("emptyState.description") }}
      />

      <CrudDialog<CreateAchievementInput, unknown>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingAchievement ? t("editTitle") : t("createTitle")}
        schema={createAchievementSchema}
        defaultValues={editingAchievement ? achievementToDefaults(editingAchievement) : EMPTY_DEFAULTS}
        mode={editingAchievement ? "edit" : "create"}
        onSubmit={(values) => {
          const sanitized: CreateAchievementInput = {
            ...values,
            criteriaCategory:
              values.criteriaType === "TOTAL_QUESTS_CATEGORY"
                ? (values.criteriaCategory ?? null)
                : null,
          };
          return editingAchievement
            ? updateAchievement.mutateAsync({ id: editingAchievement.id, dto: sanitized })
            : createAchievement.mutateAsync(sanitized);
        }}
        onSuccess={() =>
          toast({ title: editingAchievement ? t("toast.updated") : t("toast.created") })
        }
      >
        {(form) => {
          const criteriaType = form.watch("criteriaType");
          return (
            <>
              <TextField name="title" label={t("form.title")} placeholder={t("form.titlePlaceholder")} required />
              <TextField name="description" label={t("form.description")} placeholder={t("form.descPlaceholder")} required />
              <div className="grid grid-cols-2 gap-4">
                <TextField name="badgeIcon" label={t("form.icon")} placeholder="🔥" required />
                <SelectField name="criteriaType" label={t("form.criteriaType")} options={CRITERIA_OPTIONS} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  name="criteriaTarget"
                  label={t("form.goalTarget")}
                  min={1}
                  description={t("form.goalTargetDesc")}
                  required
                />
                {criteriaType === "TOTAL_QUESTS_CATEGORY" ? (
                  <SelectField
                    name="criteriaCategory"
                    label={t("form.questCategoryFocus")}
                    options={CATEGORY_OPTIONS}
                    placeholder={t("form.selectCategory")}
                    required
                  />
                ) : (
                  <SelectField name="rarity" label={t("form.rarity")} options={RARITY_OPTIONS} required />
                )}
              </div>
              {criteriaType === "TOTAL_QUESTS_CATEGORY" && (
                <SelectField name="rarity" label={t("form.rarity")} options={RARITY_OPTIONS} required />
              )}
            </>
          );
        }}
      </CrudDialog>

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

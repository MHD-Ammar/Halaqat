"use client";

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
  useAdminMilestones,
  useCreateMilestone,
  useDeleteMilestone,
  useUpdateMilestone,
  type MilestoneReward,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";
import {
  createMilestoneSchema,
  REWARD_TYPE_LABELS,
  REWARD_TYPES,
  type CreateMilestoneInput,
} from "@/lib/schemas/milestone";

const REWARD_OPTIONS = REWARD_TYPES.map((r) => ({ value: r, label: REWARD_TYPE_LABELS[r] }));

const EMPTY_DEFAULTS: CreateMilestoneInput = {
  targetLevel: 2,
  title: "",
  rewardType: "BONUS_XP",
  rewardValue: "",
};

function milestoneToDefaults(m: MilestoneReward): CreateMilestoneInput {
  return { targetLevel: m.targetLevel, title: m.title, rewardType: m.rewardType, rewardValue: m.rewardValue };
}

export function MilestonesTab() {
  const t = useTranslations("GamificationHub.milestones");
  const { data: milestones = [], isLoading } = useAdminMilestones();
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneReward | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => { setEditingMilestone(null); setDialogOpen(true); };
  const handleOpenEdit = (m: MilestoneReward) => { setEditingMilestone(m); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!milestoneToDelete) return;
    try {
      await deleteMilestone.mutateAsync(milestoneToDelete);
      toast({ title: t("toast.deleted") });
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setMilestoneToDelete(null);
    }
  };

  const columns = [
    {
      header: t("columns.level"),
      cell: (r: MilestoneReward) => (
        <Badge variant="default" className="text-xs">
          {t("levelBadge", { level: r.targetLevel })}
        </Badge>
      ),
    },
    { header: t("columns.title"), accessorFn: (r: MilestoneReward) => r.title, className: "font-medium" },
    {
      header: t("columns.rewardType"),
      cell: (r: MilestoneReward) => <Badge variant="outline">{r.rewardType.replace("_", " ")}</Badge>,
    },
    { header: t("columns.value"), accessorFn: (r: MilestoneReward) => r.rewardValue },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (r: MilestoneReward) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => { setMilestoneToDelete(r.id); setDeleteDialogOpen(true); }}
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
        data={milestones}
        columns={columns}
        isLoading={isLoading}
        emptyState={{ title: t("emptyState.title"), description: t("emptyState.description") }}
      />

      <CrudDialog<CreateMilestoneInput, unknown>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingMilestone ? t("editTitle") : t("createTitle")}
        schema={createMilestoneSchema}
        defaultValues={editingMilestone ? milestoneToDefaults(editingMilestone) : EMPTY_DEFAULTS}
        mode={editingMilestone ? "edit" : "create"}
        onSubmit={(values) =>
          editingMilestone
            ? updateMilestone.mutateAsync({ id: editingMilestone.id, dto: values })
            : createMilestone.mutateAsync(values)
        }
        onSuccess={() =>
          toast({ title: editingMilestone ? t("toast.updated") : t("toast.created") })
        }
        size="sm"
      >
        {() => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <NumberField name="targetLevel" label={t("form.targetLevel")} min={1} required />
              <TextField name="title" label={t("form.title")} placeholder={t("form.titlePlaceholder")} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField name="rewardType" label={t("form.rewardType")} options={REWARD_OPTIONS} required />
              <TextField name="rewardValue" label={t("form.rewardValue")} placeholder={t("form.valuePlaceholder")} required />
            </div>
          </>
        )}
      </CrudDialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={handleDelete}
        isPending={deleteMilestone.isPending}
      />
    </div>
  );
}

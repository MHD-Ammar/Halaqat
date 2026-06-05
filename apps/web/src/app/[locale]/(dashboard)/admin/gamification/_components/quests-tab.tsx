"use client";

import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CrudDialog } from "@/components/ui/crud-dialog";
import {
  NumberField,
  SelectField,
  SwitchField,
  TextField,
} from "@/components/ui/form-fields";
import {
  useAdminQuests,
  useCreateQuest,
  useDeleteQuest,
  useUpdateQuest,
  type Quest,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";
import { createQuestSchema, type CreateQuestInput } from "@/lib/schemas/quest";

const CATEGORY_OPTIONS = Object.values(QuestCategory).map((c) => ({ value: c, label: c }));
const FREQUENCY_OPTIONS = Object.values(QuestFrequency).map((f) => ({ value: f, label: f }));

const EMPTY_DEFAULTS: CreateQuestInput = {
  title: "",
  description: "",
  category: QuestCategory.GENERAL,
  frequency: QuestFrequency.DAILY,
  xpReward: 10,
  icon: "⭐",
  isActive: true,
  target: 1,
  targetUnit: "",
};

function questToDefaults(q: Quest): CreateQuestInput {
  return {
    title: q.title,
    description: q.description ?? "",
    category: q.category,
    frequency: q.frequency,
    xpReward: q.xpReward,
    icon: q.icon,
    isActive: q.isActive,
    target: q.target ?? 1,
    targetUnit: q.targetUnit ?? "",
  };
}

export function QuestsTab() {
  const t = useTranslations("GamificationHub.quests");
  const { data: quests = [], isLoading } = useAdminQuests();
  const createQuest = useCreateQuest();
  const updateQuest = useUpdateQuest();
  const deleteQuest = useDeleteQuest();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => { setEditingQuest(null); setDialogOpen(true); };
  const handleOpenEdit = (q: Quest) => { setEditingQuest(q); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!questToDelete) return;
    try {
      await deleteQuest.mutateAsync(questToDelete);
      toast({ title: t("toast.deleted") });
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setQuestToDelete(null);
    }
  };

  const columns = [
    { header: t("columns.icon"), cell: (r: Quest) => <span className="text-2xl">{r.icon}</span> },
    {
      header: t("columns.title"),
      cell: (r: Quest) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.title}</span>
          {r.target > 1 && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Target: {r.target} {r.targetUnit ?? ""}
            </span>
          )}
        </div>
      ),
    },
    { header: t("columns.category"), cell: (r: Quest) => <Badge variant="outline">{r.category}</Badge> },
    { header: t("columns.frequency"), cell: (r: Quest) => <Badge variant="secondary">{r.frequency}</Badge> },
    { header: t("columns.xp"), accessorFn: (r: Quest) => r.xpReward },
    {
      header: t("columns.status"),
      cell: (r: Quest) => (
        <Badge variant={r.isActive ? "default" : "secondary"}>
          {r.isActive ? t("columns.active") : t("columns.inactive")}
        </Badge>
      ),
    },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (r: Quest) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => { setQuestToDelete(r.id); setDeleteDialogOpen(true); }}
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
        data={quests}
        columns={columns}
        isLoading={isLoading}
        emptyState={{ title: t("emptyState.title"), description: t("emptyState.description") }}
      />

      <CrudDialog<CreateQuestInput, unknown>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingQuest ? t("editTitle") : t("createTitle")}
        schema={createQuestSchema}
        defaultValues={editingQuest ? questToDefaults(editingQuest) : EMPTY_DEFAULTS}
        mode={editingQuest ? "edit" : "create"}
        onSubmit={(values) =>
          editingQuest
            ? updateQuest.mutateAsync({ id: editingQuest.id, dto: values })
            : createQuest.mutateAsync(values)
        }
        onSuccess={() =>
          toast({ title: editingQuest ? t("toast.updated") : t("toast.created") })
        }
      >
        {() => (
          <>
            <TextField name="title" label={t("form.title")} placeholder={t("form.titlePlaceholder")} required />
            <TextField name="description" label={t("form.description")} placeholder={t("form.descPlaceholder")} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField name="category" label={t("form.category")} options={CATEGORY_OPTIONS} required />
              <SelectField name="frequency" label={t("form.frequency")} options={FREQUENCY_OPTIONS} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField name="xpReward" label={t("form.xpReward")} min={0} required />
              <TextField name="icon" label={t("form.icon")} placeholder="⭐" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField name="target" label="الهدف (خطوات)" min={1} description="للمهام متعددة الخطوات" required />
              <TextField name="targetUnit" label="وحدة الهدف" placeholder="مثلاً: صفحات" />
            </div>
            <SwitchField name="isActive" label={t("form.activeStatus")} description={t("form.activeDesc")} />
          </>
        )}
      </CrudDialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={handleDelete}
        isPending={deleteQuest.isPending}
      />
    </div>
  );
}

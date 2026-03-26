"use client";

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
  useAdminMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  type MilestoneReward,
  type RewardType,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";

const REWARD_TYPES: RewardType[] = ["BONUS_XP", "AVATAR_FRAME", "TITLE"];

const milestoneSchema = z.object({
  targetLevel: z.number().min(1, "Target Level must be at least 1"),
  title: z.string().min(2, "Title is required"),
  rewardType: z.enum(["BONUS_XP", "AVATAR_FRAME", "TITLE"] as const),
  rewardValue: z.string().min(1, "Reward Value is required"),
});

type MilestoneFormValues = z.infer<typeof milestoneSchema>;

export function MilestonesTab() {
  const t = useTranslations("GamificationHub.milestones");
  const { data: milestones = [], isLoading } = useAdminMilestones();
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneReward | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      targetLevel: 2,
      title: "",
      rewardType: "BONUS_XP",
      rewardValue: "",
    },
  });

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    form.reset({
      targetLevel: 2,
      title: "",
      rewardType: "BONUS_XP",
      rewardValue: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (milestone: MilestoneReward) => {
    setEditingMilestone(milestone);
    form.reset({
      targetLevel: milestone.targetLevel,
      title: milestone.title,
      rewardType: milestone.rewardType,
      rewardValue: milestone.rewardValue,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: MilestoneFormValues) => {
    try {
      if (editingMilestone) {
        await updateMilestone.mutateAsync({ id: editingMilestone.id, dto: values });
        toast({ title: t("toast.updated") });
      } else {
        await createMilestone.mutateAsync(values);
        toast({ title: t("toast.created") });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: t("toast.operationFailed"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!milestoneToDelete) return;
    try {
      await deleteMilestone.mutateAsync(milestoneToDelete);
      toast({ title: t("toast.deleted") });
      setDeleteDialogOpen(false);
      setMilestoneToDelete(null);
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    }
  };

  const columns = [
    {
      header: t("columns.level"),
      cell: (row: MilestoneReward) => (
        <Badge variant="default" className="text-xs">
          {t("levelBadge", { level: row.targetLevel })}
        </Badge>
      ),
    },
    {
      header: t("columns.title"),
      accessorFn: (row: MilestoneReward) => row.title,
      className: "font-medium",
    },
    {
      header: t("columns.rewardType"),
      cell: (row: MilestoneReward) => (
        <Badge variant="outline">{row.rewardType.replace("_", " ")}</Badge>
      ),
    },
    {
      header: t("columns.value"),
      accessorFn: (row: MilestoneReward) => row.rewardValue,
    },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (row: MilestoneReward) => (
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
              setMilestoneToDelete(row.id);
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
        data={milestones}
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
        title={editingMilestone ? t("editTitle") : t("createTitle")}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.targetLevel")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rewardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.rewardType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.selectType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REWARD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rewardValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.rewardValue")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.valuePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createMilestone.isPending || updateMilestone.isPending}>
                {editingMilestone ? t("form.save") : t("form.create")}
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
        isPending={deleteMilestone.isPending}
      />
    </div>
  );
}

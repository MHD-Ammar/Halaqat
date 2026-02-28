"use client";

import { QuestCategory, QuestFrequency } from "@halaqat/types";
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
import { Switch } from "@/components/ui/switch";
import { useAdminQuests, useCreateQuest, useUpdateQuest, useDeleteQuest, type Quest } from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";

const questSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(QuestCategory),
  frequency: z.nativeEnum(QuestFrequency),
  xpReward: z.number().min(0, "XP must be at least 0"),
  icon: z.string().min(1, "Icon is required"),
  isActive: z.boolean(),
});

type QuestFormValues = z.infer<typeof questSchema>;

export function QuestsTab() {
  const t = useTranslations("GamificationHub.quests");
  const { data: quests = [], isLoading } = useAdminQuests();
  const createQuest = useCreateQuest();
  const updateQuest = useUpdateQuest();
  const deleteQuest = useDeleteQuest();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  const form = useForm<QuestFormValues>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      title: "",
      description: "",
      category: QuestCategory.GENERAL,
      frequency: QuestFrequency.DAILY,
      xpReward: 10,
      icon: "⭐",
      isActive: true,
    },
  });

  const handleOpenCreate = () => {
    setEditingQuest(null);
    form.reset({
      title: "",
      description: "",
      category: QuestCategory.GENERAL,
      frequency: QuestFrequency.DAILY,
      xpReward: 10,
      icon: "⭐",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (quest: Quest) => {
    setEditingQuest(quest);
    form.reset({
      title: quest.title,
      description: quest.description,
      category: quest.category,
      frequency: quest.frequency,
      xpReward: quest.xpReward,
      icon: quest.icon,
      isActive: quest.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: QuestFormValues) => {
    try {
      if (editingQuest) {
        await updateQuest.mutateAsync({ id: editingQuest.id, dto: values });
        toast({ title: t("toast.updated") });
      } else {
        await createQuest.mutateAsync(values);
        toast({ title: t("toast.created") });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: t("toast.operationFailed"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!questToDelete) return;
    try {
      await deleteQuest.mutateAsync(questToDelete);
      toast({ title: t("toast.deleted") });
      setDeleteDialogOpen(false);
      setQuestToDelete(null);
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    }
  };

  const columns = [
    {
      header: t("columns.icon"),
      cell: (row: Quest) => <span className="text-2xl">{row.icon}</span>,
    },
    {
      header: t("columns.title"),
      accessorFn: (row: Quest) => row.title,
      className: "font-medium",
    },
    {
      header: t("columns.category"),
      cell: (row: Quest) => <Badge variant="outline">{row.category}</Badge>,
    },
    {
      header: t("columns.frequency"),
      cell: (row: Quest) => <Badge variant="secondary">{row.frequency}</Badge>,
    },
    {
      header: t("columns.xp"),
      accessorFn: (row: Quest) => row.xpReward,
    },
    {
      header: t("columns.status"),
      cell: (row: Quest) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? t("columns.active") : t("columns.inactive")}
        </Badge>
      ),
    },
    {
      header: t("columns.actions"),
      className: "w-[120px] text-right",
      cell: (row: Quest) => (
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
              setQuestToDelete(row.id);
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
        data={quests}
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
        title={editingQuest ? t("editTitle") : t("createTitle")}
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
                    <Input placeholder={t("form.descPlaceholder")} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.frequency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.selectFrequency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(QuestFrequency).map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
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
                name="xpReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.xpReward")}</FormLabel>
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
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.icon")}</FormLabel>
                    <FormControl>
                      <Input placeholder="⭐" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t("form.activeStatus")}</FormLabel>
                    <FormDescription>
                      {t("form.activeDesc")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createQuest.isPending || updateQuest.isPending}>
                {editingQuest ? t("form.save") : t("form.create")}
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
        isPending={deleteQuest.isPending}
      />
    </div>
  );
}

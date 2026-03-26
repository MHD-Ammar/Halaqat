"use client";

import { StoreItemType } from "@halaqat/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useAdminStoreItems, useCreateStoreItem, useUpdateStoreItem, useDeleteStoreItem, useToggleStoreItem, type StoreItem } from "@/hooks/use-admin-store-items";
import { useToast } from "@/hooks/use-toast";

const storeItemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  nameAr: z.string().min(2, "Arabic name is required"),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  type: z.nativeEnum(StoreItemType),
  xpCost: z.number().min(0, "XP cost must be at least 0"),
  rewardValue: z.string().min(1, "Reward value is required"),
  icon: z.string().min(1, "Icon is required"),
  isActive: z.boolean(),
  minLevel: z.number().min(1),
  maxPerStudent: z.number().nullable().optional(),
  stock: z.number().nullable().optional(),
});

type StoreItemFormValues = z.infer<typeof storeItemSchema>;

export function StoreTab() {
  const t = useTranslations("GamificationHub.store");
  const { data: storeItems = [], isLoading } = useAdminStoreItems();
  const createItem = useCreateStoreItem();
  const updateItem = useUpdateStoreItem();
  const deleteItem = useDeleteStoreItem();
  const toggleItemStatus = useToggleStoreItem();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const form = useForm<StoreItemFormValues>({
    resolver: zodResolver(storeItemSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      type: StoreItemType.STREAK_SHIELD,
      xpCost: 100,
      rewardValue: "1",
      icon: "🎁",
      isActive: true,
      minLevel: 1,
      maxPerStudent: null,
      stock: null,
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.reset({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      type: StoreItemType.STREAK_SHIELD,
      xpCost: 100,
      rewardValue: "1",
      icon: "🎁",
      isActive: true,
      minLevel: 1,
      maxPerStudent: null,
      stock: null,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: StoreItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      nameAr: item.nameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      type: item.type,
      xpCost: item.xpCost,
      rewardValue: item.rewardValue,
      icon: item.icon,
      isActive: item.isActive,
      minLevel: item.minLevel,
      maxPerStudent: item.maxPerStudent,
      stock: item.stock,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: StoreItemFormValues) => {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, dto: values });
        toast({ title: t("toast.updated") });
      } else {
        await createItem.mutateAsync(values);
        toast({ title: t("toast.created") });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: t("toast.operationFailed"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem.mutateAsync(itemToDelete);
      toast({ title: t("toast.deleted") });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch {
      toast({ title: t("toast.deleteFailed"), variant: "destructive" });
    }
  };

  const columns = [
    {
      header: t("columns.icon"),
      cell: (row: StoreItem) => <span className="text-2xl">{row.icon}</span>,
    },
    {
      header: t("columns.name"),
      accessorFn: (row: StoreItem) => row.nameAr,
      className: "font-medium",
    },
    {
      header: t("columns.type"),
      cell: (row: StoreItem) => <Badge variant="outline">{t(`types.${row.type}`)}</Badge>,
    },
    {
      header: t("columns.cost"),
      accessorFn: (row: StoreItem) => `${row.xpCost} XP`,
    },
    {
      header: t("columns.level"),
      accessorFn: (row: StoreItem) => `Lvl ${row.minLevel}`,
    },
    {
      header: t("columns.stock"),
      cell: (row: StoreItem) => (
        <span className="text-sm text-muted-foreground">
          {row.stock === null ? t("form.unlimited") : row.stock}
        </span>
      ),
    },
    {
      header: t("columns.status"),
      cell: (row: StoreItem) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? t("columns.active") : t("columns.inactive")}
        </Badge>
      ),
    },
    {
      header: t("columns.actions"),
      className: "w-[160px] text-right",
      cell: (row: StoreItem) => (
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => {
              toggleItemStatus.mutate(row.id);
              toast({ title: t("toast.updated") });
            }}
            disabled={toggleItemStatus.isPending}
          />
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
              setItemToDelete(row.id);
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
        data={storeItems}
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
        title={editingItem ? t("editTitle") : t("createTitle")}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nameAr")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholderNameAr")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholderNameEn")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.descAr")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
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
                    <FormLabel>{t("form.descEn")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.type")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(StoreItemType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="🎁" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="xpCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.xpCost")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.minLevel")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
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
                      <Input placeholder={t("form.placeholderRewardValue")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxPerStudent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.maxPerStudent")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t("form.unlimited")}
                        {...field} 
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.stock")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t("form.unlimited")}
                        {...field} 
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} 
                      />
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
                    <FormLabel className="text-base">{t("form.status")}</FormLabel>
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
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {editingItem ? t("form.save") : t("form.create")}
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
        isPending={deleteItem.isPending}
      />
    </div>
  );
}

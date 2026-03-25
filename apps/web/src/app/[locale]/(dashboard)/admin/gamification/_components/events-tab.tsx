"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, type SeasonalEvent } from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  name: z.string().min(2, "Name is required"),
  nameAr: z.string().min(2, "Arabic Name is required"),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().min(1, "End date is required"),
  xpMultiplier: z.number().min(1, "Multiplier must be at least 1"),
  icon: z.string().min(1, "Icon is required"),
  themeColor: z.string().min(1, "Theme color is required"),
  isActive: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function EventsTab() {
  const t = useTranslations("GamificationHub.events");
  const { data: events = [], isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SeasonalEvent | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      xpMultiplier: 1.5,
      icon: "🎉",
      themeColor: "amber",
      isActive: true,
    },
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    form.reset({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      xpMultiplier: 1.5,
      icon: "🎉",
      themeColor: "amber",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (event: SeasonalEvent) => {
    setEditingEvent(event);
    form.reset({
      name: event.name,
      nameAr: event.nameAr,
      description: event.description,
      descriptionAr: event.descriptionAr,
      startsAt: new Date(event.startsAt).toISOString().split('T')[0],
      endsAt: new Date(event.endsAt).toISOString().split('T')[0],
      xpMultiplier: event.xpMultiplier,
      icon: event.icon,
      themeColor: event.themeColor,
      isActive: event.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: EventFormValues) => {
    try {
      const dto = {
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      };

      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, dto });
        toast({ title: t("toast.updated") || "تم تحديث الفعالية بنجاح" });
      } else {
        await createEvent.mutateAsync(dto);
        toast({ title: t("toast.created") || "تم إنشاء الفعالية بنجاح" });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: t("toast.operationFailed") || "فشلت العملية", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent.mutateAsync(eventToDelete);
      toast({ title: t("toast.deleted") || "تم حذف الفعالية" });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch {
      toast({ title: t("toast.deleteFailed") || "فشل حذف الفعالية", variant: "destructive" });
    }
  };

  const columns = [
    {
      header: t("columns.icon") || "الأيقونة",
      cell: (row: SeasonalEvent) => <span className="text-2xl">{row.icon}</span>,
    },
    {
      header: t("columns.name") || "الاسم",
      accessorFn: (row: SeasonalEvent) => row.nameAr,
      className: "font-medium",
    },
    {
      header: t("columns.multiplier") || "المضاعف",
      cell: (row: SeasonalEvent) => (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
          ×{row.xpMultiplier}
        </Badge>
      ),
    },
    {
      header: t("columns.period") || "الفترة",
      cell: (row: SeasonalEvent) => (
        <div className="text-xs text-muted-foreground">
          <div>من: {new Date(row.startsAt).toLocaleDateString("ar-EG")}</div>
          <div>إلى: {new Date(row.endsAt).toLocaleDateString("ar-EG")}</div>
        </div>
      ),
    },
    {
      header: t("columns.status") || "الحالة",
      cell: (row: SeasonalEvent) => {
        const now = new Date();
        const start = new Date(row.startsAt);
        const end = new Date(row.endsAt);
        const isCurrent = now >= start && now <= end && row.isActive;
        
        return (
          <Badge variant={isCurrent ? "default" : "secondary"}>
            {isCurrent ? (t("status.active") || "نشط") : (t("status.inactive") || "غير نشط")}
          </Badge>
        );
      },
    },
    {
      header: t("columns.actions") || "إجراءات",
      className: "w-[120px] text-right",
      cell: (row: SeasonalEvent) => (
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
              setEventToDelete(row.id);
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
        <h2 className="text-xl font-semibold tracking-tight">{t("title") || "الفعاليات الموسمية"}</h2>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t("createBtn") || "إنشاء فعالية"}
        </Button>
      </div>

      <DataTable
        data={events}
        columns={columns}
        isLoading={isLoading}
        emptyState={{
          title: t("emptyState.title") || "لا توجد فعاليات مسجلة",
          description: t("emptyState.description") || "ابدأ بإنشاء فعالية موسمية جديدة لإعطاء الطلاب حوافز إضافية.",
        }}
      />

      <GenericDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingEvent ? (t("editTitle") || "تعديل الفعالية") : (t("createTitle") || "إنشاء فعالية")}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nameEn") || "Name (En)"}</FormLabel>
                    <FormControl>
                      <Input placeholder="Ramadan Event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nameAr") || "الاسم (بالعربي)"}</FormLabel>
                    <FormControl>
                      <Input placeholder="فعالية رمضان" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="descriptionAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.descriptionAr") || "الوصف (بالعربي)"}</FormLabel>
                  <FormControl>
                    <Input placeholder="وصف الفعالية..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.startsAt") || "تاريخ البدء"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.endsAt") || "تاريخ الانتهاء"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="xpMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.multiplier") || "مضاعف النقاط"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)} 
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
                    <FormLabel>{t("form.icon") || "الأيقونة"}</FormLabel>
                    <FormControl>
                      <Input placeholder="🎉" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.themeColor") || "اللون"}</FormLabel>
                    <FormControl>
                      <Input placeholder="amber" {...field} />
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
                    <FormLabel className="text-base">{t("form.activeStatus") || "الحالة"}</FormLabel>
                    <FormDescription>
                      {t("form.activeDesc") || "تفعيل الفعالية في الوقت المحدد"}
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
                {t("form.cancel") || "إلغاء"}
              </Button>
              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                {editingEvent ? (t("form.save") || "حفظ") : (t("form.create") || "إنشاء")}
              </Button>
            </div>
          </form>
        </Form>
      </GenericDialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("delete.title") || "حذف الفعالية"}
        description={t("delete.description") || "هل أنت متأكد من حذف هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء."}
        onConfirm={handleDelete}
        isPending={deleteEvent.isPending}
      />
    </div>
  );
}

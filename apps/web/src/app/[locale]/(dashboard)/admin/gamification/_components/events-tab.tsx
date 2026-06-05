"use client";

import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CrudDialog } from "@/components/ui/crud-dialog";
import {
  DateField,
  NumberField,
  SwitchField,
  TextField,
} from "@/components/ui/form-fields";
import {
  useAdminEvents,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
  type SeasonalEvent,
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";
import { createEventSchema, type CreateEventInput } from "@/lib/schemas/event";

const TODAY = new Date().toISOString().split("T")[0] ?? "";
const NEXT_WEEK = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0] ?? "";

const EMPTY_DEFAULTS: CreateEventInput = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  startsAt: TODAY,
  endsAt: NEXT_WEEK,
  xpMultiplier: 1.5,
  icon: "🎉",
  themeColor: "amber",
  isActive: true,
};

function eventToDefaults(e: SeasonalEvent): CreateEventInput {
  return {
    name: e.name,
    nameAr: e.nameAr,
    description: e.description ?? "",
    descriptionAr: e.descriptionAr ?? "",
    startsAt: new Date(e.startsAt).toISOString().split("T")[0] ?? "",
    endsAt: new Date(e.endsAt).toISOString().split("T")[0] ?? "",
    xpMultiplier: e.xpMultiplier,
    icon: e.icon,
    themeColor: e.themeColor,
    isActive: e.isActive,
  };
}

export function EventsTab() {
  const t = useTranslations("GamificationHub.events");
  const { data: events = [], isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SeasonalEvent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => { setEditingEvent(null); setDialogOpen(true); };
  const handleOpenEdit = (e: SeasonalEvent) => { setEditingEvent(e); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent.mutateAsync(eventToDelete);
      toast({ title: t("toast.deleted") || "تم حذف الفعالية" });
    } catch {
      toast({ title: t("toast.deleteFailed") || "فشل الحذف", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const columns = [
    {
      header: t("columns.icon") || "الأيقونة",
      cell: (r: SeasonalEvent) => <span className="text-2xl">{r.icon}</span>,
    },
    {
      header: t("columns.name") || "الاسم",
      accessorFn: (r: SeasonalEvent) => r.nameAr,
      className: "font-medium",
    },
    {
      header: t("columns.multiplier") || "المضاعف",
      cell: (r: SeasonalEvent) => (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
          ×{r.xpMultiplier}
        </Badge>
      ),
    },
    {
      header: t("columns.period") || "الفترة",
      cell: (r: SeasonalEvent) => (
        <div className="text-xs text-muted-foreground">
          <div>من: {new Date(r.startsAt).toLocaleDateString("ar-EG")}</div>
          <div>إلى: {new Date(r.endsAt).toLocaleDateString("ar-EG")}</div>
        </div>
      ),
    },
    {
      header: t("columns.status") || "الحالة",
      cell: (r: SeasonalEvent) => {
        const now = new Date();
        const active =
          now >= new Date(r.startsAt) && now <= new Date(r.endsAt) && r.isActive;
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? t("status.active") || "نشط" : t("status.inactive") || "غير نشط"}
          </Badge>
        );
      },
    },
    {
      header: t("columns.actions") || "إجراءات",
      className: "w-[120px] text-right",
      cell: (r: SeasonalEvent) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => { setEventToDelete(r.id); setDeleteDialogOpen(true); }}
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
        <h2 className="text-xl font-semibold tracking-tight">
          {t("title") || "الفعاليات الموسمية"}
        </h2>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t("createBtn") || "إنشاء فعالية"}
        </Button>
      </div>

      <DataTable
        data={events}
        columns={columns}
        isLoading={isLoading}
        emptyState={{
          title: t("emptyState.title") || "لا توجد فعاليات",
          description: t("emptyState.description") || "ابدأ بإنشاء فعالية موسمية جديدة",
        }}
      />

      <CrudDialog<CreateEventInput, unknown>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingEvent ? t("editTitle") || "تعديل الفعالية" : t("createTitle") || "إنشاء فعالية"}
        schema={createEventSchema}
        defaultValues={editingEvent ? eventToDefaults(editingEvent) : EMPTY_DEFAULTS}
        mode={editingEvent ? "edit" : "create"}
        onSubmit={(values) => {
          const dto: CreateEventInput = {
            ...values,
            startsAt: new Date(values.startsAt).toISOString(),
            endsAt: new Date(values.endsAt).toISOString(),
          };
          return editingEvent
            ? updateEvent.mutateAsync({ id: editingEvent.id, dto })
            : createEvent.mutateAsync(dto);
        }}
        onSuccess={() =>
          toast({
            title: editingEvent
              ? t("toast.updated") || "تم تحديث الفعالية"
              : t("toast.created") || "تم إنشاء الفعالية",
          })
        }
      >
        {() => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <TextField name="name" label={t("form.nameEn") || "الاسم (إنجليزي)"} placeholder="Ramadan Event" required />
              <TextField name="nameAr" label={t("form.nameAr") || "الاسم (عربي)"} placeholder="فعالية رمضان" required />
            </div>
            <TextField name="descriptionAr" label={t("form.descriptionAr") || "الوصف (عربي)"} />
            <div className="grid grid-cols-2 gap-4">
              <DateField name="startsAt" label={t("form.startsAt") || "تاريخ البدء"} required />
              <DateField name="endsAt" label={t("form.endsAt") || "تاريخ الانتهاء"} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <NumberField name="xpMultiplier" label={t("form.multiplier") || "مضاعف النقاط"} min={1} step={0.1} required />
              <TextField name="icon" label={t("form.icon") || "الأيقونة"} placeholder="🎉" required />
              <TextField name="themeColor" label={t("form.themeColor") || "اللون"} placeholder="amber" required />
            </div>
            <SwitchField
              name="isActive"
              label={t("form.activeStatus") || "الحالة"}
              description={t("form.activeDesc") || "تفعيل الفعالية في الوقت المحدد"}
            />
          </>
        )}
      </CrudDialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("delete.title") || "حذف الفعالية"}
        description={t("delete.description") || "هل أنت متأكد من حذف هذه الفعالية؟"}
        onConfirm={handleDelete}
        isPending={deleteEvent.isPending}
      />
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ClipboardList, 
  Search,
  MessageSquare
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  usePendingFulfillments, 
  useUpdateFulfillment,
  FulfillmentItem 
} from "@/hooks/use-admin-gamification";
import { useToast } from "@/hooks/use-toast";

export function FulfillmentsTab() {
  const t = useTranslations("AdminGamification");
  const { toast } = useToast();
  const { data: fulfillments, isLoading } = usePendingFulfillments();
  const updateFulfillment = useUpdateFulfillment();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentItem | null>(null);
  const [actionType, setActionType] = useState<"fulfilled" | "cancelled" | null>(null);
  const [notes, setNotes] = useState("");

  const filteredFulfillments = fulfillments?.filter(f => 
    f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedFulfillment || !actionType) return;

    try {
      await updateFulfillment.mutateAsync({
        id: selectedFulfillment.id,
        status: actionType,
        notes: notes.trim() || undefined
      });

      toast({
        title: actionType === "fulfilled" ? "تم التسليم بنجاح" : "تم الإلغاء بنجاح",
        description: `${selectedFulfillment.itemName} - ${selectedFulfillment.studentName}`,
      });
      
      closeDialog();
    } catch {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const openDialog = (fulfillment: FulfillmentItem, type: "fulfilled" | "cancelled") => {
    setSelectedFulfillment(fulfillment);
    setActionType(type);
    setNotes("");
  };

  const closeDialog = () => {
    setSelectedFulfillment(null);
    setActionType(null);
    setNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            {t("fulfillmentsTitle") || "إدارة تسليم الجوائز"}
          </h2>
          <p className="text-muted-foreground">
            {t("fulfillmentsDesc") || "قم بمراجعة وmarked الجوائز المادية لـ " + (fulfillments?.length || 0) + " طالب."}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder") || "بحث عن طالب أو جائزة..."}
            className="pl-9 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden border-muted/60">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-right">{t("fulfillmentTable.student") || "الطالب"}</TableHead>
              <TableHead className="text-right">{t("fulfillmentTable.item") || "الجائزة"}</TableHead>
              <TableHead className="text-right">{t("fulfillmentTable.xp") || "XP"}</TableHead>
              <TableHead className="text-right">{t("fulfillmentTable.date") || "التاريخ"}</TableHead>
              <TableHead className="text-left">{t("fulfillmentTable.actions") || "الإجراءات"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFulfillments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 opacity-20" />
                    <p>{t("noPendingFulfillments") || "لا توجد طلبات تسليم معلقة حالياً"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFulfillments?.map((f) => (
                <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{f.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{f.itemIcon}</span>
                      <span>{f.itemName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">
                      -{f.xpSpent} XP
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(f.purchasedAt), "d MMM yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg h-8 px-2"
                        onClick={() => openDialog(f, "fulfilled")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1 ml-1" />
                        {t("fulfillAction") || "تم التسليم"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg h-8 px-2"
                        onClick={() => openDialog(f, "cancelled")}
                      >
                        <XCircle className="h-4 w-4 mr-1 ml-1" />
                        {t("cancelAction") || "إلغاء"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedFulfillment} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "fulfilled" 
                ? (t("confirmFulfillment") || "تأكيد التسليم") 
                : (t("confirmCancellation") || "إلغاء الطلب")}
            </DialogTitle>
            <DialogDescription>
              {actionType === "fulfilled"
                ? "هل أنت متأكد من تسليم الجائزة للطالب؟ سيتم إغلاق الطلب."
                : "هل سيتم إلغاء الطلب؟ سيتم استرداد الـ XP للطالب تلقائياً."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
              <div className="text-2xl">{selectedFulfillment?.itemIcon}</div>
              <div>
                <p className="font-bold">{selectedFulfillment?.itemName}</p>
                <p className="text-sm text-muted-foreground">{selectedFulfillment?.studentName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {t("fulfillmentNotes") || "ملاحظات إضافية (اختياري)"}
              </label>
              <Textarea
                placeholder="أضف أي ملاحظات هنا..."
                className="rounded-xl resize-none min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">
              {t("cancel") || "تراجع"}
            </Button>
            <Button
              className={actionType === "fulfilled" ? "bg-emerald-600 hover:bg-emerald-700 rounded-xl" : "bg-rose-600 hover:bg-rose-700 rounded-xl"}
              onClick={handleAction}
              disabled={updateFulfillment.isPending}
            >
              {updateFulfillment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionType === "fulfilled" ? (t("confirm") || "تأكيد التسليم") : (t("confirm") || "تأكيد الإلغاء")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

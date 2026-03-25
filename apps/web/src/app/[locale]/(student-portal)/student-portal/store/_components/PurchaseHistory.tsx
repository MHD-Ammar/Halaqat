"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePurchaseHistory } from "@/hooks/use-student-store";

export function PurchaseHistory() {
  const { data: purchases, isLoading } = usePurchaseHistory();
  const t = useTranslations("StudentStore");

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl mt-4">
        <Package className="h-12 w-12 mb-4 opacity-20" />
        <p>{t("noPurchases") || "لا يوجد سجل مشتريات حالياً"}</p>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("statusPending") || "قيد التسليم"}
          </Badge>
        );
      case "fulfilled":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("statusFulfilled") || "تم التسليم"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("statusCancelled") || "ملغي"}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-xl font-bold mb-4">{t("historyTitle") || "سجل المشتريات"}</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="overflow-hidden border-muted/60 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shadow-sm border border-primary/5">
                    {purchase.itemIcon || "🎁"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{purchase.itemName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(purchase.purchasedAt), "d MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-primary flex items-center gap-1">
                    -{purchase.xpSpent} XP
                  </span>
                  {getStatusBadge(purchase.fulfillmentStatus)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

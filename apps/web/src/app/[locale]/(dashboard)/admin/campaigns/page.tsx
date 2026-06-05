"use client";

import { format } from "date-fns";
import { Megaphone, Plus, Pencil, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useCampaigns, useResetStreaks } from "@/hooks/use-campaigns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { routes } from "@/lib/constants/routes";

export default function AdminCampaignsPage() {
  const t = useTranslations("AdminCampaigns");
  const { data: campaigns = [], isLoading } = useCampaigns();
  const resetStreaksMutation = useResetStreaks();
  const { toast } = useToast();
  const router = useRouter();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleConfirmReset = async () => {
    try {
      await resetStreaksMutation.mutateAsync({});
      setResetDialogOpen(false);
      toast({
        title: t("resetSuccess"),
        variant: "default",
      });
    } catch {
      toast({
        title: "Error resetting streaks",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="destructive"
            onClick={() => setResetDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {t("resetStreaks")}
          </Button>
          <Button
            onClick={() => router.push(routes.adminCampaignCreate())}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("createNew")}
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={campaigns}
            isLoading={isLoading}
            emptyState={{
              icon: Megaphone,
              title: t("noData"),
            }}
            columns={[
              {
                header: t("campaignTitle"),
                accessorKey: "title",
                className: "font-medium",
              },
              {
                header: t("startDate"),
                cell: (row) => format(new Date(row.startDate), "PP"),
              },
              {
                header: t("endDate"),
                cell: (row) => format(new Date(row.endDate), "PP"),
              },
              {
                header: t("status"),
                cell: (row) => (
                  <Badge variant={row.isActive ? "default" : "secondary"}>
                    {row.isActive ? t("active") : t("inactive")}
                  </Badge>
                ),
              },
              {
                header: t("actions"),
                className: "w-[120px] text-right",
                cell: (row) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/admin/campaigns/${row.id}/edit`)}
                      title={t("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Reset Streaks Confirmation Dialog */}
      <ConfirmationDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title={t("resetStreaks")}
        description={t("resetStreaksConfirm")}
        variant="destructive"
        icon={<AlertCircle className="h-5 w-5" />}
        isPending={resetStreaksMutation.isPending}
        onConfirm={handleConfirmReset}
        confirmLabel={t("resetStreaks")}
      />
    </div>
  );
}

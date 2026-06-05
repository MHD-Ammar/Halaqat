"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useCampaign, useUpdateCampaign } from "@/hooks/use-campaigns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { routes } from "@/lib/constants/routes";
import type { CreateCampaignDto } from "@/types/campaign";

import { CampaignForm } from "../../_components/campaign-form";

export default function EditCampaignPage() {
  const t = useTranslations("AdminCampaigns");
  const params = useParams();
  const id = params.id as string;

  const { data: campaign, isLoading } = useCampaign(id);
  const updateMutation = useUpdateCampaign();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: CreateCampaignDto) => {
    try {
      await updateMutation.mutateAsync({ id, dto: data });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      router.push(routes.adminCampaigns());
    } catch {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("editCampaign")}
        </h1>
      </div>

      <CampaignForm
        initialData={campaign}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}

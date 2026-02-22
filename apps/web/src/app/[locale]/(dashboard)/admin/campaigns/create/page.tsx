"use client";

import { useTranslations } from "next-intl";

import { useCreateCampaign } from "@/hooks/use-campaigns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import type { CreateCampaignDto } from "@/types/campaign";

import { CampaignForm } from "../_components/campaign-form";

export default function CreateCampaignPage() {
  const t = useTranslations("AdminCampaigns");
  const createMutation = useCreateCampaign();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: CreateCampaignDto) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      router.push("/admin/campaigns");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("createCampaign")}
        </h1>
      </div>

      <CampaignForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}

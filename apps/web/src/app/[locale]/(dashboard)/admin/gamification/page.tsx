"use client";

import { Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AchievementsTab } from "./_components/achievements-tab";
import { EventsTab } from "./_components/events-tab";
import { FulfillmentsTab } from "./_components/fulfillments-tab";
import { MilestonesTab } from "./_components/milestones-tab";
import { QuestsTab } from "./_components/quests-tab";
import { StoreTab } from "./_components/store-tab";

export default function GamificationHubPage() {
  const t = useTranslations("GamificationHub");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            {t("title") || "Gamification Hub"}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle") || "Manage quests, milestones, and achievements"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quests">{t("tabs.quests")}</TabsTrigger>
          <TabsTrigger value="milestones">{t("tabs.milestones")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("tabs.achievements")}</TabsTrigger>
          <TabsTrigger value="events">{t("tabs.events") || "الفعاليات"}</TabsTrigger>
          <TabsTrigger value="store">{t("tabs.store")}</TabsTrigger>
          <TabsTrigger value="fulfillments">{t("tabs.fulfillments") || "التسليم"}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quests" className="space-y-4">
          <QuestsTab />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <MilestonesTab />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementsTab />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsTab />
        </TabsContent>

        <TabsContent value="store" className="space-y-4">
          <StoreTab />
        </TabsContent>

        <TabsContent value="fulfillments" className="space-y-4">
          <FulfillmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

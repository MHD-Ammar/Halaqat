"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentDashboard } from "@/hooks/use-student-portal";
import { useStoreItems, usePurchaseItem, StoreItemWithStatus } from "@/hooks/use-student-store";
import { useToast } from "@/hooks/use-toast";

import { StoreItemCard } from "./_components/StoreItemCard";

export default function StudentStorePage() {
  const t = useTranslations();
  const { toast } = useToast();
  
  const { data: storeItems, isLoading: isStoreLoading } = useStoreItems();
  const { data: dashboardData, isLoading: isDashboardLoading } = useStudentDashboard("ramadan");
  const purchaseMutation = usePurchaseItem();

  const [selectedItem, setSelectedItem] = useState<StoreItemWithStatus | null>(null);

  const handlePurchaseClick = (item: StoreItemWithStatus) => {
    setSelectedItem(item);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    try {
      await purchaseMutation.mutateAsync(selectedItem.id);
      
      toast({
        title: t("Store.purchaseSuccess"),
        description: selectedItem.name,
      });
    } catch (error: unknown) {
       const axiosError = error as { response?: { data?: { message?: string } } };
       const message = axiosError?.response?.data?.message || t("Store.purchaseError");
       toast({
         title: t("Store.purchaseError"),
         description: message,
         variant: "destructive",
       });
    } finally {
      setSelectedItem(null);
    }
  };

  if (isStoreLoading || isDashboardLoading) {
    return <StorePageSkeleton />;
  }

  const items = storeItems || [];
  const xpBalance = dashboardData?.totalXp || 0;

  const categories = [
    { value: "all", label: t("Store.categories.all") },
    { value: "STREAK_SHIELD", label: t("Store.categories.STREAK_SHIELD") },
    { value: "AVATAR_FRAME", label: t("Store.categories.AVATAR_FRAME") },
    { value: "TITLE", label: t("Store.categories.TITLE") },
    { value: "DOUBLE_XP", label: t("Store.categories.DOUBLE_XP") },
    { value: "REAL_WORLD", label: t("Store.categories.REAL_WORLD") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-10">
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {t("Store.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              Spend your hard-earned XP on exciting rewards!
            </p>
          </div>
          
          {/* XP Balance Display */}
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 px-4 py-2 rounded-2xl font-bold text-lg shadow-sm border border-amber-200 dark:border-amber-900/50">
            <Coins className="w-6 h-6" />
            <span>{t("Store.xpBalance", { xp: xpBalance })}</span>
          </div>
        </div>

        {/* Tabs and Grid */}
        <Tabs defaultValue="all" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 sm:flex sm:overflow-x-auto h-auto sm:h-12 rounded-2xl bg-muted/50 p-1 mb-6 sm:no-scrollbar justify-start sm:justify-center gap-1">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value} 
                className="rounded-xl data-[state=active]:shadow-md text-xs sm:text-sm md:text-base transition-all whitespace-nowrap min-w-fit px-2 sm:px-4 py-2"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0 focus-visible:outline-none">
            <StoreGrid 
              items={items} 
              onPurchase={handlePurchaseClick} 
              isPurchasing={purchaseMutation.isPending} 
            />
          </TabsContent>

          {categories.filter(c => c.value !== "all").map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-0 focus-visible:outline-none">
              <StoreGrid 
                items={items.filter(i => i.type === cat.value)} 
                onPurchase={handlePurchaseClick} 
                isPurchasing={purchaseMutation.isPending} 
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Purchase Confirmation Modal */}
        <AlertDialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Store.confirmPurchase")}</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItem && t("Store.confirmPurchaseDesc", { item: selectedItem.name, xp: selectedItem.xpCost })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={purchaseMutation.isPending}>{t("Store.cancel")}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  confirmPurchase();
                }}
                disabled={purchaseMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {purchaseMutation.isPending ? t("Common.processing") : t("Store.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </motion.div>
    </div>
  );
}

function StoreGrid({ 
  items, 
  onPurchase, 
  isPurchasing 
}: { 
  items: StoreItemWithStatus[], 
  onPurchase: (item: StoreItemWithStatus) => void,
  isPurchasing: boolean 
}) {
  const t = useTranslations();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-2xl">
          🛍️
        </div>
        <h3 className="text-xl font-bold">{t("Common.noData")}</h3>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
          }}
          className="h-full"
        >
          <StoreItemCard 
            item={item} 
            onPurchase={onPurchase} 
            isPurchasing={isPurchasing}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function StorePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-12 w-32 rounded-2xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl mb-6" />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

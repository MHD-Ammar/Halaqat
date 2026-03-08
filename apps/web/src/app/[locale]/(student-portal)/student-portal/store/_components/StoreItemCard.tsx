"use client";

import { motion } from "framer-motion";
import { Lock, Coins, Shield, Star, Trophy, Gift, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoreItemWithStatus, StoreItemType } from "@/hooks/use-student-store";
import { cn } from "@/lib/utils";

interface StoreItemCardProps {
  item: StoreItemWithStatus;
  onPurchase: (item: StoreItemWithStatus) => void;
  isPurchasing: boolean;
}

const TYPE_ICONS: Record<StoreItemType, React.ElementType> = {
  STREAK_SHIELD: Shield,
  AVATAR_FRAME: Star,
  TITLE: Trophy,
  REAL_WORLD: Gift,
  DOUBLE_XP: Zap,
};

export function StoreItemCard({ item, onPurchase, isPurchasing }: StoreItemCardProps) {
  const t = useTranslations();
  
  const Icon = TYPE_ICONS[item.type] || Star;

  // Determine the status text to show if cannot purchase
  let statusText = null;
  if (!item.inStock) {
    statusText = t("Store.outOfStock");
  } else if (!item.meetsLevelReq) {
    statusText = t("Store.requiresLevel", { level: item.minLevel });
  } else if (!item.withinLimit) {
    statusText = t("Store.limitReached");
  } else if (!item.canAfford) {
    statusText = t("Store.insufficientBalance");
  }

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 transition-all flex flex-col h-full",
        !item.canPurchase && "opacity-80 grayscale-[0.2]"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 p-2">
           <Icon className="w-8 h-8" />
        </div>
        {item.stock !== null && (
          <Badge variant={item.stock > 0 ? "secondary" : "destructive"}>
            {item.stock}
          </Badge>
        )}
      </div>

      <h3 className="font-bold text-lg mb-1">{item.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
        {item.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center font-bold text-amber-500">
          <Coins className="w-4 h-4 mr-1" />
          {item.xpCost}
        </div>

        {item.canPurchase ? (
          <Button 
            size="sm" 
            onClick={() => onPurchase(item)}
            disabled={isPurchasing}
            className="rounded-xl font-bold"
          >
            {t("Store.buyNow")}
          </Button>
        ) : (
          <div className="flex items-center text-xs font-semibold text-destructive px-2 py-1 bg-destructive/10 rounded-md">
            <Lock className="w-3 h-3 mr-1" />
            {statusText}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface StreakMultiplierBadgeProps {
  multiplier: number;
  multiplierLabel: string;
  tier: number;
  currentStreak: number;
  nextMultiplierDaysNeeded: number | null;
  nextMultiplierLabel: string | null;
}

export function StreakMultiplierBadge({
  multiplier,
  multiplierLabel,
  tier,
  nextMultiplierDaysNeeded,
}: StreakMultiplierBadgeProps) {
  const t = useTranslations("StudentPortal");
  const isDefault = multiplier === 1.0;

  const getColorsByTier = (tierIndex: number) => {
    switch (tierIndex) {
      case 1:
        return "from-orange-400 to-orange-600 shadow-orange-500/50";
      case 2:
        return "from-red-500 to-rose-600 shadow-red-500/50";
      case 3:
        return "from-purple-500 to-indigo-600 shadow-purple-500/50";
      case 4:
        return "from-yellow-400 to-amber-600 shadow-yellow-500/50";
      default:
        // Default muted style
        return "from-slate-200 to-slate-300 shadow-slate-400/10 text-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300";
    }
  };

  const colors = getColorsByTier(tier);

  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br px-6 py-3 font-bold shadow-lg ${tier > 0 ? "text-white" : ""} ${colors}`}
      >
        {/* Pulsing background effect for active multiplier */}
        {!isDefault && (
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50 blur-md ${colors}`}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ zIndex: -1 }}
          />
        )}
        
        <div className="flex items-center space-x-2 space-x-reverse text-xl sm:text-2xl z-10">
          {!isDefault && <span>🔥</span>}
          <span>{multiplierLabel}</span>
        </div>
      </motion.div>
      <div className="text-center text-sm font-medium text-muted-foreground px-4">
        {isDefault ? (
          <span>{t("multiplierThresholdInfo")}</span>
        ) : nextMultiplierDaysNeeded !== null ? (
          <span>
            {t.rich("nextMultiplierInfo", {
              days: nextMultiplierDaysNeeded,
              span: (chunks) => <span className="font-bold text-primary px-1">{chunks}</span>
            })}
          </span>
        ) : (
          <span className="text-amber-500 font-bold">{t("maxMultiplierReached")}</span>
        )}
      </div>
    </div>
  );
}


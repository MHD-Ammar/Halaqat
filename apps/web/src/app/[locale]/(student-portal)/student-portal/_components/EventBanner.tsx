import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import React from "react";

interface EventBannerProps {
  event: {
    id: string;
    nameAr: string;
    descriptionAr: string | null;
    icon: string;
    themeColor: string;
    xpMultiplier: number;
    remainingHours: number;
    remainingDays: number;
    endsAt: string;
  };
}

const colorMap: Record<string, string> = {
  amber: "from-amber-500 to-orange-600",
  blue: "from-blue-500 to-indigo-600",
  green: "from-emerald-500 to-teal-600",
  red: "from-red-500 to-rose-600",
  purple: "from-purple-500 to-violet-600",
  pink: "from-pink-500 to-fuchsia-600",
};

export function EventBanner({ event }: EventBannerProps) {
  const t = useTranslations("StudentPortal.event");
  const bgGradient = colorMap[event.themeColor] || colorMap.amber;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${bgGradient} p-6 shadow-lg text-white`}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-24 w-24 rounded-full bg-black/10 blur-xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl shadow-inner backdrop-blur-sm">
            {event.icon}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold tracking-tight">{event.nameAr}</h2>
            <p className="text-white/80 text-sm mt-1">{event.descriptionAr}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-col items-center px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20">
            <span className="text-xs uppercase tracking-wider text-white/70">
              {t("endsIn") || "باقي على الانتهاء"}
            </span>
            <span className="text-lg font-bold">
              {event.remainingDays > 0 
                ? `${event.remainingDays} يوم و ${event.remainingHours % 24} ساعة`
                : `${event.remainingHours} ساعة`}
            </span>
          </div>

          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-2xl font-bold shadow-xl border-2 border-orange-100"
          >
            <span className="text-2xl">🔥</span>
            <span className="text-xl">
              نقاط × {event.xpMultiplier}
            </span>
          </motion.div>
        </div>
      </div>
      
      {/* Animated Glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/10 to-transparent"
      />
    </motion.div>
  );
}

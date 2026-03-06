"use client";

import { motion } from "framer-motion";
import { Coffee, Rocket } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface DailyQuestCTAProps {
  hasSubmittedToday: boolean;
}

export function DailyQuestCTA({ hasSubmittedToday }: DailyQuestCTAProps) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-8 shadow-sm transition-all ${
      hasSubmittedToday 
        ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/10 border-green-200 dark:border-green-900" 
        : "bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20"
    }`}>
      {/* Decorative background elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {hasSubmittedToday ? (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
              <Coffee className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">أنجزت مهامك اليوم بنجاح</h2>
              <p className="text-green-600/80 dark:text-green-400/80 font-medium">استرح يا بطل! لقد أكملت وردك اليومي.</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary ring-4 ring-primary/10">
              <Rocket className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">لديك مهام جديدة!</h2>
              <p className="text-muted-foreground font-medium">أكمل وردك اليومي لتحافظ على سلسلة الحضور واكسب المزيد من نقاط الخبرة.</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Link href="/student-portal/quests" className="w-full sm:w-auto mt-2">
                <Button size="lg" className="h-14 w-full rounded-full text-lg shadow-lg hover:scale-105 transition-transform sm:w-auto px-10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    🚀 انطلق لإنجاز مهام اليوم!
                  </span>
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

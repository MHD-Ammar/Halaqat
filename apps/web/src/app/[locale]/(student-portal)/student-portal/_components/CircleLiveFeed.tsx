"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useLiveFeed } from "@/hooks/use-student-portal";

export function CircleLiveFeed() {
  const t = useTranslations("StudentPortal");
  const { data: feedItems, isLoading } = useLiveFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !feedItems || feedItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % feedItems.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [mounted, feedItems]);

  if (!mounted || isLoading) return null;

  const displayItems = feedItems && feedItems.length > 0 
    ? feedItems 
    : [{ id: "fallback", emoji: "🌟", text: t("liveFeedWelcome") }];

  const currentItem = displayItems[currentIndex % displayItems.length];

  if (!currentItem) return null;

  const isFallback = currentItem.id === "fallback";
  const liveItem = currentItem as import("@/hooks/use-student-portal").LiveFeedItem;
  const fallbackText = (currentItem as any).text;

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="flex items-center bg-primary/5 backdrop-blur-sm border border-primary/10 rounded-2xl h-12 px-4 shadow-sm w-full max-w-2xl overflow-hidden relative">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-xl text-primary font-bold text-sm shrink-0 h-8 self-center">
          <span className="text-base leading-none">📣</span>
          {t("circleNews")}
        </div>
        
        <div className="flex-1 overflow-hidden relative h-full flex items-center mx-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 w-full truncate"
            >
              <span className="text-lg leading-none shrink-0">{currentItem.emoji}</span>
              <span className="truncate">
                {isFallback ? (
                  fallbackText
                ) : (
                  liveItem.studentTitle ? (
                    t(`liveFeed.${liveItem.type.toLowerCase()}Completed`, {
                      name: liveItem.studentName,
                      title: t(`titles.${liveItem.studentTitle}`, { fallback: liveItem.studentTitle }),
                      item: liveItem.itemName
                    })
                  ) : (
                    t(`liveFeed.${liveItem.type.toLowerCase()}CompletedNoTitle`, {
                      name: liveItem.studentName,
                      item: liveItem.itemName
                    })
                  )
                )}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

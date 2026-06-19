"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useLiveFeed, useToggleFeedReaction, LiveFeedItem } from "@/hooks/use-student-portal";
import { soundManager } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function CircleLiveFeed() {
  const t = useTranslations("StudentPortal");
  const { data: feedItems, isLoading } = useLiveFeed();
  const { mutate: toggleReaction } = useToggleFeedReaction();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !feedItems || feedItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % feedItems.length);
    }, 4500); // Slightly longer to allow interaction

    return () => clearInterval(interval);
  }, [mounted, feedItems]);

  if (!mounted || isLoading) return null;

  type FallbackItem = { id: string; emoji: string; text: string };
  const displayItems: (LiveFeedItem | FallbackItem)[] = feedItems && feedItems.length > 0 
    ? feedItems 
    : [{ id: "fallback", emoji: "🌟", text: t("liveFeedWelcome") }];

  const currentItem = displayItems[currentIndex % displayItems.length];

  if (!currentItem) return null;

  const isFallback = currentItem.id === "fallback";
  const liveItem = currentItem as LiveFeedItem;
  const fallbackText = isFallback ? (currentItem as FallbackItem).text : "";

  const handleReact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFallback) return;

    if (!liveItem.hasReacted) {
      soundManager.play("achievementUnlock");
    }
    toggleReaction(liveItem.id);
  };

  const renderText = () => {
    if (isFallback) return fallbackText;

    const type = liveItem.type.toLowerCase();
    const typeKey = type.includes("_") ? type.replace(/_([a-z])/g, (g) => g[1]!.toUpperCase()) : type;
    
    // Support new event types with specific translation keys or fallback to generic ones
    const hasTitle = !!liveItem.studentTitle;
    const baseKey = `liveFeed.${typeKey}Completed${hasTitle ? "" : "NoTitle"}`;
    
    return t(baseKey, {
      name: liveItem.studentName,
      title: liveItem.studentTitle ? t(`titles.${liveItem.studentTitle}`, { fallback: liveItem.studentTitle }) : "",
      item: liveItem.itemName
    });
  };

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-primary/10 rounded-2xl min-h-16 py-2 px-3 sm:px-4 shadow-sm w-full max-w-2xl overflow-hidden relative group">
        <div className="flex items-center gap-2 bg-primary/10 px-2.5 sm:px-3 py-1.5 rounded-xl text-primary font-bold text-sm shrink-0 self-center">
          <span className="text-base leading-none">📣</span>
          {/* Label hidden on the narrowest screens to leave room for the news text. */}
          <span className="hidden sm:inline">{t("circleNews")}</span>
        </div>

        {/* Fixed two-line height keeps the crossfade smooth while letting the
            full message show across up to two lines instead of one word. */}
        <div className="flex-1 overflow-hidden relative h-11 flex items-center mx-2 sm:mx-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200 w-full"
            >
              <span className="text-xl leading-none shrink-0">{currentItem.emoji}</span>
              <span className="line-clamp-2 text-sm md:text-base leading-snug">
                {renderText()}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {!isFallback && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReact}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shrink-0",
              liveItem.hasReacted 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <span>{t("liveFeed.congrats")}</span>
            {liveItem.reactionCount > 0 && (
              <span className={cn(
                "min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px]",
                liveItem.hasReacted ? "bg-white text-primary" : "bg-primary text-white"
              )}>
                {liveItem.reactionCount}
              </span>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

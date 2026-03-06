"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

// Mock data for the live feed
const MOCK_FEED_ITEMS = [
  { id: "1", emoji: "🔥", text: "أحمد وصل للمستوى 5!" },
  { id: "2", emoji: "🏆", text: "محمود أنهى مهامه اليومية!" },
  { id: "3", emoji: "🏅", text: "حلقة أبو بكر تتقدم في الترتيب العام!" },
];

export function CircleLiveFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || MOCK_FEED_ITEMS.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % MOCK_FEED_ITEMS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || MOCK_FEED_ITEMS.length === 0) return null;

  const currentItem = MOCK_FEED_ITEMS[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="flex items-center bg-primary/5 backdrop-blur-sm border border-primary/10 rounded-2xl h-12 px-4 shadow-sm w-full max-w-2xl overflow-hidden relative">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-xl text-primary font-bold text-sm shrink-0 h-8 self-center">
          <span className="text-base leading-none">📣</span>
          أخبار الحلقة
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
              <span className="truncate">{currentItem.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * LevelUpModal Component
 *
 * Displays a celebratory modal with confetti when the student levels up.
 * Features:
 * - Full-screen dark overlay
 * - Glowing badge with new level number
 * - Confetti animation
 * - Celebratory text and icons
 */

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { soundManager } from "@/lib/sounds";

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  earnedXp: number;
  newTotalXp: number;
  unlockedMilestones?: any[]; // the milestones unlocked from this level up
  onClose: () => void;
}

export function LevelUpModal({
  isOpen,
  newLevel,
  earnedXp,
  newTotalXp,
  unlockedMilestones = [],
  onClose,
}: LevelUpModalProps) {
  const t = useTranslations();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (isOpen) {
      void soundManager.play("levelUp");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {isOpen && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
        />
      )}

      <div className="relative flex flex-col items-center gap-6 px-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Level Badge */}
        <div className="relative">
          {/* Glowing background circles */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-2xl opacity-70" />

          {/* Main badge */}
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-white/80">
                {t("Gamification.level")}
              </span>
              <span className="text-6xl font-black text-white drop-shadow-lg">
                {newLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Celebratory Text */}
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold text-white">
            {t("Gamification.levelUp")}
          </h2>
          <p className="text-lg text-amber-100">
            🛡️ {t("Gamification.youReachedLevel")} {newLevel} 🛡️
          </p>
          {unlockedMilestones.length > 0 && (
            <p className="mt-4 animate-bounce text-xl font-black text-green-300 drop-shadow-md">
              🎁 لقد فتحت صندوقاً جديداً! 
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex w-full max-sm gap-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-300">{t("Gamification.earnedToday")}</p>
            <p className="text-2xl font-bold text-yellow-300">+{earnedXp}</p>
          </div>
          <div className="h-12 border-l border-white/20" />
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-300">{t("Gamification.totalXp")}</p>
            <p className="text-2xl font-bold text-yellow-300">{newTotalXp}</p>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="mt-4 w-full max-sm rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {t("Common.continue")}
        </Button>
      </div>
    </div>
  );
}

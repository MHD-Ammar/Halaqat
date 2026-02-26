"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { Achievement } from "@/hooks/use-student-achievements";

interface AchievementUnlockedModalProps {
  isOpen: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

export function AchievementUnlockedModal({
  isOpen,
  achievements,
  onClose,
}: AchievementUnlockedModalProps) {
  const t = useTranslations();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (!isOpen || achievements.length === 0) return null;

  const currentAchievement = achievements[currentIndex];

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
      setCurrentIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {isOpen && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={400}
          gravity={0.2}
          colors={["#FFD700", "#FFA500", "#FF8C00", "#FFDF00", "#FFFFFF"]}
        />
      )}

      <div className="relative flex flex-col items-center gap-6 px-6 max-w-sm w-full">
        {/* Glow Effect */}
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-tr from-yellow-400 via-amber-200 to-yellow-600 blur-[80px] opacity-40" />

        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-widest text-yellow-500 drop-shadow-md">
            تم فتح إنجاز جديد!
          </h2>
        </div>

        {/* Badge Icon Container */}
        <div className="relative group">
          <div className="absolute inset-0 -z-10 animate-spin-slow rounded-full bg-gradient-to-r from-yellow-300 via-yellow-600 to-yellow-300 opacity-60 blur-xl" />
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-[6px] border-yellow-400 bg-gradient-to-b from-yellow-100 to-yellow-300 shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-105">
             <div className="relative z-10 text-[5rem] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                {currentAchievement?.badgeIcon || "🏆"}
             </div>
             {/* Shimmer Effect */}
             <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
          </div>
        </div>

        {/* Achievement Details */}
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-black text-white drop-shadow-lg">
            {currentAchievement?.title}
          </h3>
          <p className="text-lg text-yellow-100 drop-shadow-sm px-4">
            {currentAchievement?.description}
          </p>
        </div>

        {/* Counter if multiple */}
        {achievements.length > 1 && (
          <div className="flex space-x-2 space-x-reverse mt-2">
            {achievements.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 w-2 rounded-full transition-colors ${idx === currentIndex ? "bg-yellow-400" : "bg-white/30"}`}
              />
            ))}
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleNext}
          className="mt-6 w-full max-w-[200px] rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-6 text-lg font-bold text-white shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] active:scale-95"
        >
          {currentIndex < achievements.length - 1 ? t("Common.continue") : "رائع!"}
        </Button>
      </div>
    </div>
  );
}

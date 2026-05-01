"use client";

/**
 * MistakeLegend Component
 *
 * A floating bar explaining the colors used for word-level recitation mistakes.
 */

import React from "react";

import { cn } from "@/lib/utils";

interface MistakeLegendProps {
  className?: string;
}

export const MistakeLegend: React.FC<MistakeLegendProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6 rounded-full border border-primary/20 bg-background/80 px-6 py-2 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <span className="text-sm font-medium">خطأ حفظ</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        <span className="text-sm font-medium">خطأ تجويد</span>
      </div>
    </div>
  );
};

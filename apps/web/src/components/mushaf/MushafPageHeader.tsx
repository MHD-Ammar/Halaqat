"use client";

/**
 * MushafPageHeader Component
 *
 * Slim bar displaying Mushaf metadata like Surah name, Juz, and Page number.
 */

import React from "react";

import { cn } from "@/lib/utils";

interface MushafPageHeaderProps {
  surahName: string;
  surahEnglishName: string;
  pageNumber: number;
  juzNumber: number;
  className?: string;
}

export const MushafPageHeader: React.FC<MushafPageHeaderProps> = ({
  surahName,
  surahEnglishName,
  pageNumber,
  juzNumber,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between border-b border-primary/10 bg-muted/30 px-6 py-2 text-sm text-muted-foreground",
        className
      )}
    >
      {/* Left: Surah Info */}
      <div className="flex items-center gap-2">
        <span className="font-['Uthmanic'] text-lg text-primary">سورة {surahName}</span>
        <span className="hidden opacity-60 sm:inline">({surahEnglishName})</span>
      </div>

      {/* Center: Page Number */}
      <div className="flex items-center gap-1 font-medium">
        <span>صفحة</span>
        <span className="text-foreground">{pageNumber}</span>
      </div>

      {/* Right: Juz Info */}
      <div className="flex items-center gap-1">
        <span>الجزء</span>
        <span className="font-bold text-foreground">{juzNumber}</span>
      </div>
    </div>
  );
};

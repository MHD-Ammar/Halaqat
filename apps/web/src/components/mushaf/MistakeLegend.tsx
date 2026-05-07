"use client";

/**
 * MistakeLegend
 *
 * Floating bar that explains the colour mapping for word-level mistakes.
 * Driven entirely by {@link MISTAKE_TYPES_IN_ORDER} so adding a new mistake
 * type is a one-line change.
 */

import React from "react";

import { cn } from "@/lib/utils";

import {
  MISTAKE_TYPES_IN_ORDER,
  getMistakeStyle,
} from "./mistake-style";

interface MistakeLegendProps {
  className?: string;
}

export const MistakeLegend: React.FC<MistakeLegendProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 rounded-full border border-primary/20 bg-background/85 px-5 py-2 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {MISTAKE_TYPES_IN_ORDER.map((type) => {
        const style = getMistakeStyle(type);
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className={cn("h-2.5 w-2.5 rounded-full", style.bgSolid)}
              style={{ boxShadow: `0 0 8px ${style.hex}80` }}
            />
            <span className="text-xs font-medium">{style.label}</span>
          </div>
        );
      })}
    </div>
  );
};

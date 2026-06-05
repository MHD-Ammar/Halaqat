"use client";

/**
 * useMushafKeyboard
 *
 * Attaches a single `keydown` listener that maps keyboard shortcuts to
 * assessor actions. Guards against firing while the user is typing inside a
 * text input, textarea, or select element.
 *
 * Keyboard map (RTL-aware):
 *   ← / ArrowLeft  → next page  (RTL: left = forward)
 *   → / ArrowRight → prev page  (RTL: right = back)
 *   m              → MEMORIZATION mode
 *   t              → TAJWEED mode
 *   u / Ctrl+Z     → undo last
 *   Enter          → save (if there are pending mistakes)
 *   Escape         → close all drawers
 *   g              → open page-jump input
 */

import { MistakeType } from "@halaqat/types";
import { useEffect } from "react";

export interface MushafKeyboardHandlers {
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetMode: (mode: MistakeType.MEMORIZATION | MistakeType.TAJWEED) => void;
  onUndo: () => void;
  onSave: () => void;
  onCloseAllDrawers: () => void;
  onOpenPageJump: () => void;
  /** Set to false while a text input is focused or a modal is open. */
  enabled: boolean;
}

export function useMushafKeyboard(handlers: MushafKeyboardHandlers) {
  const {
    onPrevPage,
    onNextPage,
    onSetMode,
    onUndo,
    onSave,
    onCloseAllDrawers,
    onOpenPageJump,
    enabled,
  } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when focus is inside an editable element.
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        // RTL: ArrowLeft = advance (next page), ArrowRight = go back (prev page)
        case "ArrowLeft":
          e.preventDefault();
          onNextPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          onPrevPage();
          break;

        case "m":
        case "M":
          onSetMode(MistakeType.MEMORIZATION);
          break;

        case "t":
        case "T":
          onSetMode(MistakeType.TAJWEED);
          break;

        case "u":
        case "U":
          onUndo();
          break;

        case "z":
        case "Z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onUndo();
          }
          break;

        case "Enter":
          e.preventDefault();
          onSave();
          break;

        case "Escape":
          onCloseAllDrawers();
          break;

        case "g":
        case "G":
          e.preventDefault();
          onOpenPageJump();
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onPrevPage,
    onNextPage,
    onSetMode,
    onUndo,
    onSave,
    onCloseAllDrawers,
    onOpenPageJump,
  ]);
}

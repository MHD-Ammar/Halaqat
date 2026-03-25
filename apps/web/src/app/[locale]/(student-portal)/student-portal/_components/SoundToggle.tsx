"use client";
/* eslint-disable import/order */

import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { soundManager } from "@/lib/sounds";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  const t = useTranslations("StudentPortal");

  useEffect(() => {
    setEnabled(soundManager.isEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    soundManager.setEnabled(next);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9 rounded-full"
          aria-label={enabled ? t("soundMute") : t("soundUnmute")}
        >
          {enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{enabled ? t("soundMute") : t("soundUnmute")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

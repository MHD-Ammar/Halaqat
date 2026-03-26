import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface LeagueBadgeProps {
  leagueNameAr: string;
  leagueIcon: string;
  leagueRank: number;
  weekEndsAt: string;
  className?: string;
}

const RANK_THEME: Record<number, string> = {
  1: "from-amber-700 to-amber-900 border-amber-800 text-amber-100",
  2: "from-slate-300 to-slate-500 border-slate-400 text-slate-900",
  3: "from-yellow-300 to-yellow-600 border-yellow-400 text-yellow-950",
  4: "from-cyan-300 to-blue-500 border-cyan-400 text-cyan-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
  5: "from-violet-400 to-fuchsia-600 border-violet-300 text-violet-50 shadow-[0_0_20px_rgba(192,132,252,0.45)]",
};

function getDaysRemaining(weekEndsAt: string): number {
  const end = new Date(weekEndsAt).getTime();
  const now = Date.now();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function LeagueBadge({
  leagueNameAr,
  leagueIcon,
  leagueRank,
  weekEndsAt,
  className,
}: LeagueBadgeProps) {
  const t = useTranslations("StudentPortal");
  const daysRemaining = getDaysRemaining(weekEndsAt);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border-4 bg-gradient-to-b p-6 shadow-lg",
        RANK_THEME[leagueRank] ?? RANK_THEME[1],
        className,
      )}
    >
      <div className="mb-3 text-5xl">{leagueIcon}</div>
      <h2 className="text-2xl font-black tracking-wider">{leagueNameAr}</h2>
      <p className="mt-2 rounded-full bg-black/15 px-3 py-1 text-xs font-bold">
        {t("weekEndsInDays", { days: daysRemaining })}
      </p>
    </div>
  );
}

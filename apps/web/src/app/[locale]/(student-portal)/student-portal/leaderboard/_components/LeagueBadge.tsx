import { Diamond, Medal, Shield, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

interface LeagueBadgeProps {
  leagueNameAr: string;
  className?: string;
}

export function LeagueBadge({ leagueNameAr, className }: LeagueBadgeProps) {
  let colorClass = "";
  let Icon = Shield;

  if (leagueNameAr.includes("برونزي")) {
    colorClass = "from-amber-700 to-amber-900 border-amber-800 text-amber-100";
    Icon = Medal;
  } else if (leagueNameAr.includes("فضي")) {
    colorClass = "from-slate-300 to-slate-500 border-slate-400 text-slate-900";
    Icon = Shield;
  } else if (leagueNameAr.includes("ذهبي")) {
    colorClass = "from-yellow-300 to-yellow-600 border-yellow-400 text-yellow-950";
    Icon = Trophy;
  } else if (leagueNameAr.includes("ماسي")) {
    colorClass = "from-cyan-300 to-blue-500 border-cyan-400 text-cyan-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]";
    Icon = Diamond;
  }

  return (
    <div 
      className={cn(
        "mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border-4 bg-gradient-to-b p-6 shadow-lg", 
        colorClass, 
        className
      )}
    >
      <Icon className="mb-4 h-16 w-16 opacity-90" />
      <h2 className="text-2xl font-black tracking-wider">{leagueNameAr}</h2>
    </div>
  );
}

"use client";

import { BookOpen, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Recitation {
  date: string;
  surah: string;
  quality: string;
  mistakesCount: number;
  type: string;
}

interface RecentRecitationsProps {
  recitations: Recitation[];
}

const QUALITY_MAP: Record<string, { label: string; color: string }> = {
  EXCELLENT: { label: "ممتاز", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  GOOD: { label: "جيد جداً", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  ACCEPTABLE: { label: "جيد", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  NEEDS_IMPROVEMENT: { label: "يحتاج مراجعة", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
};

export function RecentRecitations({ recitations }: RecentRecitationsProps) {
  if (!recitations || recitations.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-muted/30 rounded-3xl">
        <CardContent className="flex flex-col flex-1 items-center justify-center py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">لا توجد تسميعات حديثة حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm rounded-3xl border-muted/60 overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          سجل التسميع
        </CardTitle>
        <CardDescription className="text-xs font-medium">
          أحدث تقييماتك في الحلقة من المعلم
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        {recitations.map((recitation, index) => {
          const qMap = QUALITY_MAP[recitation.quality] || QUALITY_MAP["ACCEPTABLE"]!;
          const dateStr = recitation.date 
            ? new Date(recitation.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })
            : "غير معروف";
            
          return (
            <div key={index} className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 group">
              <div className="grid gap-1.5">
                <p className="font-bold text-sm group-hover:text-primary transition-colors pr-1 border-r-2 border-primary/40">سورة {recitation.surah}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="bg-muted px-2 py-0.5 rounded-md">{dateStr}</span>
                  {recitation.mistakesCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500/80 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">
                      <AlertCircle className="h-3 w-3" />
                      أخطاء: {recitation.mistakesCount}
                    </span>
                  )}
                  {recitation.mistakesCount === 0 && (
                    <span className="text-green-600/80 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-md">بلا أخطاء</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={`${qMap.color} font-bold px-3 py-1 shadow-sm`}>
                  {qMap.label}
                </Badge>
                <span className="text-[10px] font-semibold text-muted-foreground/80 lowercase tracking-wider bg-muted/50 rounded-md px-2 py-0.5">
                  {recitation.type === "NEW_LESSON" ? "درس جديد" : "مراجعة"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

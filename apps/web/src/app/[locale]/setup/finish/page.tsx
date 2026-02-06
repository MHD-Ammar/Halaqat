"use client";

/**
 * Setup Finish Page (Step 3)
 *
 * Final step of the setup wizard:
 * - Shows success summary
 * - Displays circle name and student count
 * - Button to start using the app
 */

import { CheckCircle2, Users, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";

export default function SetupFinishPage() {
  const router = useRouter();
  const t = useTranslations("Setup");

  const [circleName, setCircleName] = useState<string>("");
  const [studentCount, setStudentCount] = useState<number>(0);

  // Get setup info from session storage
  useEffect(() => {
    const storedCircleName = sessionStorage.getItem("setup_circleName");
    const storedStudentCount = sessionStorage.getItem("setup_studentCount");

    if (!storedCircleName) {
      // No setup data, go back to welcome
      router.replace("/setup/welcome");
      return;
    }

    setCircleName(storedCircleName);
    setStudentCount(parseInt(storedStudentCount || "0", 10));
  }, [router]);

  // Clear session storage and navigate to my-circle
  const handleStart = () => {
    sessionStorage.removeItem("setup_circleId");
    sessionStorage.removeItem("setup_circleName");
    sessionStorage.removeItem("setup_studentCount");
    router.push("/my-circle");
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center space-y-4">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>

        <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
        <CardDescription className="text-lg">
          {studentCount > 0
            ? t("successMessage", { count: studentCount })
            : t("noStudentsAdded")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Circle Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-sm text-muted-foreground">الحلقة</div>
            <div className="font-semibold truncate">{circleName}</div>
          </div>

          {/* Students Count */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-sm text-muted-foreground">الطلاب</div>
            <div className="font-semibold text-2xl">{studentCount}</div>
          </div>
        </div>

        {/* Start Button */}
        <Button onClick={handleStart} className="w-full py-6 text-lg" size="lg">
          {t("startNow")}
        </Button>
      </CardContent>
    </Card>
  );
}

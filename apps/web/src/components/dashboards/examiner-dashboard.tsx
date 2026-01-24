"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ExaminerDashboard() {
  const router = useRouter();
  const t = useTranslations("Common");

  useEffect(() => {
    // Redirect to exams page
    router.replace("/exams");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <p className="text-muted-foreground">{t("loading")}</p>
      <Button onClick={() => router.push("/exams")}>Go to Exams</Button>
    </div>
  );
}

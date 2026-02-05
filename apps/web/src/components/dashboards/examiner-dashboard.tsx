"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";

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

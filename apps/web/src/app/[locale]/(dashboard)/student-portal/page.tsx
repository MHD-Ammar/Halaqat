"use client";

/**
 * Student Portal Page
 *
 * Dashboard for students to view their progress and QR code for attendance.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentPortal } from "@/hooks/use-student-portal";
import { Award, BookOpen, Calendar, GraduationCap } from "lucide-react";

export default function StudentPortalPage() {
  const t = useTranslations("StudentPortal");
  const [activeTab, setActiveTab] = useState("progress");
  const { data, isLoading, studentId } = useStudentPortal();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const student = data?.student;
  const stats = data?.stats;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          {student?.name || t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("circle")}</p>
                <p className="font-semibold">{student?.circle?.name || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalPoints")}
                </p>
                <p className="font-semibold">{stats?.totalPoints || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("attendanceRate")}
                </p>
                <p className="font-semibold">{stats?.attendanceRate || 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pagesMemorized")}
                </p>
                <p className="font-semibold">{stats?.totalRecitations || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="progress">{t("progress")}</TabsTrigger>
          <TabsTrigger value="qr">{t("myQr")}</TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {t("pagesMemorized")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  {stats?.totalRecitations || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("pagesMemorized")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  {t("attendanceRate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">
                  {stats?.attendanceRate || 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("attendanceRate")}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{t("myQr")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("scanQrDescription")}
              </p>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              {studentId ? (
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <QRCode
                    value={studentId}
                    size={200}
                    level="H"
                    className="w-48 h-48 md:w-56 md:h-56"
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">{t("noData")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

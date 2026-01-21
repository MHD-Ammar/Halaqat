"use client";

/**
 * Student Profile Page
 *
 * Comprehensive student profile with stats and tabbed content.
 */

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Percent,
  BookOpen,
  Calendar,
  Award,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/stats-card";
import { RecitationItem } from "@/components/recitation-item";
import { PointsItem } from "@/components/points-item";
import { useStudentProfile } from "@/hooks";

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format attendance status with color
 */
function getStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    PRESENT: { label: "Present", className: "bg-green-100 text-green-700" },
    ABSENT: { label: "Absent", className: "bg-red-100 text-red-700" },
    LATE: { label: "Late", className: "bg-yellow-100 text-yellow-700" },
    EXCUSED: { label: "Excused", className: "bg-blue-100 text-blue-700" },
  };
  const info = config[status] || { label: status, className: "bg-gray-100" };
  return (
    <Badge variant="outline" className={info.className}>
      {info.label}
    </Badge>
  );
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: profile, isLoading, error } = useStudentProfile(studentId);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Failed to load student profile
        </div>
      </div>
    );
  }

  const { student, stats, recentActivity, pointsHistory, attendanceHistory } =
    profile;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 text-2xl">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">
            {student.circle?.name || "No Circle"}
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant="secondary"
            className="text-lg px-4 py-2 bg-yellow-100 text-yellow-700"
          >
            <Star className="h-4 w-4 mr-1 fill-current" />
            {stats.totalPoints} pts
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="Attendance"
          value={`${stats.attendanceRate}%`}
          icon={Percent}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Recitations"
          value={stats.totalRecitations}
          icon={BookOpen}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Total Points"
          value={stats.totalPoints}
          icon={Award}
          iconColor="text-yellow-500"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recitations">Recitations</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recitations yet
                </p>
              ) : (
                recentActivity
                  .slice(0, 5)
                  .map((rec) => (
                    <RecitationItem
                      key={rec.id}
                      pageNumber={rec.pageNumber}
                      surahName={rec.surahName}
                      surahNameArabic={rec.surahNameArabic}
                      quality={rec.quality}
                      type={rec.type}
                      createdAt={rec.createdAt}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recitations Tab */}
        <TabsContent value="recitations" className="space-y-2 mt-4">
          {recentActivity.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recitations recorded
              </CardContent>
            </Card>
          ) : (
            recentActivity.map((rec) => (
              <RecitationItem
                key={rec.id}
                pageNumber={rec.pageNumber}
                surahName={rec.surahName}
                surahNameArabic={rec.surahNameArabic}
                quality={rec.quality}
                type={rec.type}
                createdAt={rec.createdAt}
              />
            ))
          )}
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-2 mt-4">
          {pointsHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No points recorded
              </CardContent>
            </Card>
          ) : (
            pointsHistory.map((pt) => (
              <PointsItem
                key={pt.id}
                amount={pt.amount}
                reason={pt.reason}
                createdAt={pt.createdAt}
              />
            ))
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-2 mt-4">
          {attendanceHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No attendance records
              </CardContent>
            </Card>
          ) : (
            attendanceHistory.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(att.sessionDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {getStatusBadge(att.status)}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { AttendanceStatus } from "@halaqat/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Student {
  id: string;
  name: string;
}

interface Attendance {
  studentId: string;
  status: AttendanceStatus;
}

interface Recitation {
  studentId: string;
  pageNumber: number;
}

interface PointTransaction {
  studentId: string;
  amount: number;
}

interface DailySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleName?: string;
  sessionDate: string;
  students: Student[];
  attendances: Attendance[];
  recitations?: Recitation[];
  pointTransactions?: PointTransaction[];
}

export function DailySummaryModal({
  open,
  onOpenChange,
  circleName,
  sessionDate,
  students,
  attendances,
  recitations = [],
  pointTransactions = [],
}: DailySummaryModalProps) {
  const t = useTranslations("DailySession");
  const tCommon = useTranslations("Common");

  // Create lookups
  const attendanceMap = new Map(
    attendances.map((a) => [a.studentId, a.status]),
  );

  // Group recitations by student
  const recitationMap = new Map<string, number>();
  recitations.forEach((r) => {
    const current = recitationMap.get(r.studentId) || 0;
    recitationMap.set(r.studentId, current + 1); // Counting pages
  });

  // Group points by student
  const pointsMap = new Map<string, number>();
  pointTransactions.forEach((p) => {
    const current = pointsMap.get(p.studentId) || 0;
    pointsMap.set(p.studentId, current + p.amount);
  });

  // Calculate totals
  const totalPages = recitations.length;
  const totalPoints = pointTransactions.reduce((sum, p) => sum + p.amount, 0);
  const presentCount = attendances.filter(
    (a) => a.status === AttendanceStatus.PRESENT,
  ).length;

  const getStatusConfig = (status?: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return {
          label: t("present"),
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case AttendanceStatus.ABSENT:
        return {
          label: t("absent"),
          icon: <XCircle className="h-3 w-3" />,
          className: "bg-red-100 text-red-700 border-red-200",
        };
      case AttendanceStatus.LATE:
        return {
          label: t("late"),
          icon: <Clock className="h-3 w-3" />,
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
        };
      case AttendanceStatus.EXCUSED:
      default:
        return {
          label: t("excused"),
          icon: <AlertCircle className="h-3 w-3" />,
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const formattedDate = new Date(sessionDate).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("summaryTitle")}</DialogTitle>
          <DialogDescription>
            {circleName} - {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-primary">
                  {presentCount}/{students.length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("present")}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {totalPages}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <BookOpen className="h-3 w-3" />
                  {tCommon("pages")}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {totalPoints}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3" />
                  {tCommon("points")}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed List */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40%]">{tCommon("name")}</TableHead>
                  <TableHead className="w-[20%] text-center">
                    {t("status")}
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    {tCommon("pages")}
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    {tCommon("points")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const status = attendanceMap.get(student.id);
                  const pages = recitationMap.get(student.id) || 0;
                  const points = pointsMap.get(student.id) || 0;
                  const config = getStatusConfig(status);

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${config.className} px-2 py-0.5 text-xs font-normal gap-1 mx-auto`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {pages > 0 ? (
                          <div className="font-semibold text-foreground flex items-center justify-center gap-1">
                            {pages}
                            <span className="text-xs text-muted-foreground font-normal">
                              pg
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {points !== 0 ? (
                          <div
                            className={`font-semibold flex items-center justify-center gap-1 ${points > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {points > 0 ? "+" : ""}
                            {points}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

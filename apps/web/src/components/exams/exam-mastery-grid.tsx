"use client";

import { useTranslations } from "next-intl";
import { Check, X, CheckCircle2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ExamAttempt {
    date: string;
    score: number | null;
    passed: boolean | null;
    examId: string;
    attemptNumber: number;
    status: string;
}

interface ExamCardItem {
    juz: number;
    attempts: ExamAttempt[];
}

import { Link } from "@/i18n/routing";

interface ExamMasteryGridProps {
    data: ExamCardItem[] | undefined;
    studentId: string;
}

export function ExamMasteryGrid({ data, studentId }: ExamMasteryGridProps) {
    const t = useTranslations("Exams");

    // Helper to get data for a specific Juz
    const getJuzData = (juz: number) => {
        return data?.find((item) => item.juz === juz);
    };

    // Render badge for an attempt
    const renderAttemptBadge = (attempt: ExamAttempt) => {
        let variant: "default" | "destructive" | "secondary" | "outline" = "outline";
        let icon = null;
        let colorClass = "";

        if (attempt.passed === true) {
            variant = "default";
            icon = <Check className="h-3 w-3 mr-1" />;
            colorClass = "bg-green-600 hover:bg-green-700";
        } else if (attempt.passed === false) {
            variant = "destructive";
            icon = <X className="h-3 w-3 mr-1" />;
        } else {
            variant = "secondary";
        }

        const tooltipText = `${new Date(attempt.date).toLocaleDateString()} - ${attempt.status}`;

        return (
            <Badge 
                key={attempt.examId} 
                variant={variant} 
                className={`h-7 px-2 cursor-help ${colorClass}`}
                title={tooltipText}
            >
                {icon}
                {attempt.score !== null ? attempt.score : "-"}
            </Badge>
        );
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[80px] text-center font-bold">{t("juz")}</TableHead>
                        <TableHead className="text-center w-[120px]">{t("attempt")} 1</TableHead>
                        <TableHead className="text-center w-[120px]">{t("attempt")} 2</TableHead>
                        <TableHead className="text-center w-[120px]">{t("attempt")} 3</TableHead>
                        <TableHead className="text-center">{t("status")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                        const juzData = getJuzData(juz);
                        const attempts = juzData?.attempts || [];
                        const att1 = attempts.find(a => a.attemptNumber === 1);
                        const att2 = attempts.find(a => a.attemptNumber === 2);
                        const att3 = attempts.find(a => a.attemptNumber === 3);

                        // Determine final status
                        const isPassed = attempts.some(a => a.passed === true);
                        const latestAttempt = attempts[attempts.length - 1];
                        
                        return (
                            <TableRow key={juz} className="hover:bg-muted/20">
                                <TableCell className="text-center font-bold text-muted-foreground p-0">
                                    <Link 
                                      href={`/exams/${studentId}/${juz}`}
                                      className="block w-full h-full py-4 hover:bg-muted/50 transition-colors text-primary underline-offset-4 hover:underline"
                                    >
                                        {juz}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    {att1 ? renderAttemptBadge(att1) : <span className="text-muted-foreground/30 text-xl">•</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                    {att2 ? renderAttemptBadge(att2) : <span className="text-muted-foreground/30 text-xl">•</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                    {att3 ? renderAttemptBadge(att3) : <span className="text-muted-foreground/30 text-xl">•</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                    {isPassed ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span>{t("passed")}</span>
                                        </div>
                                    ) : latestAttempt && latestAttempt.passed === false ? (
                                         <div className="flex items-center justify-center gap-2 text-destructive font-medium">
                                            <XCircle className="h-5 w-5" />
                                            <span>{t("failed")}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

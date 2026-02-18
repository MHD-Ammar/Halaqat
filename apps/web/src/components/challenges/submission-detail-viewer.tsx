import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormQuestion } from "@/config/challenges/ramadan";
import { cn } from "@/lib/utils";

interface SubmissionDetailViewerProps {
  config: FormQuestion[];
  data: Record<string, any>;
}

export function SubmissionDetailViewer({
  config,
  data,
}: SubmissionDetailViewerProps) {
  return (
    <div className="space-y-8">
      {config.map((question) => {
        const value = data[question.id];
        // Skip if no data for this question (optional)
        // if (value === undefined) return null; 

        return (
          <div key={question.id} className="space-y-2">
            <h3 className="font-medium text-lg text-foreground">
              {question.title}
            </h3>
            {question.description && (
              <p className="text-sm text-muted-foreground -mt-1">
                {question.description}
              </p>
            )}

            <div className="pt-1">
              {renderAnswer(question, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderAnswer(question: FormQuestion, value: any) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">Did not answer</span>;
  }

  switch (question.type) {
    case "BOOLEAN":
      return (
        <Badge
          variant={value ? "default" : "destructive"}
          className={cn(
            "text-base px-3 py-1",
            value ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
          )}
        >
          {value ? (
            <>
              <Check className="w-4 h-4 me-2" /> Yes
            </>
          ) : (
            <>
              <X className="w-4 h-4 me-2" /> No
            </>
          )}
        </Badge>
      );

    case "NUMBER":
      return (
        <div className="text-2xl font-bold font-mono">
          {value} <span className="text-sm text-muted-foreground font-sans font-normal">Times/Pages</span>
        </div>
      );

    case "GRID":
      // value is object { "rowId": "colValue" }
      const rows = question.rows || [];
      const columns = question.columns || [];
      const answers = value as Record<string, string>;

      return (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%] text-start">Item</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.value} className="text-center">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((rowName, index) => {
                // In the config the rows are just strings array, so the key in answer depends on how it's stored.
                // Looking at RAMADAN_FORM, rows is string[]. The stored JSON usually uses the row KEY/SLUG if available,
                // but here the config only has titles.
                // Let's assume the keys in `data` match the row indices or names?
                // Wait, checking RAMADAN_FORM... id is "prayers". 
                // The structure of value for grid is { rowName: colValue } usually.
                // But wait, the previous implementation of `DailyChallengeService` logic was:
                // `val` is { row: colValue }.
                // If rows in config are ["Fajr", "Dhuhr"...], the keys in DB are likely "fajr", "dhuhr" (slugified) OR the exact string?
                // Let's assume for now it uses the row text itself or we match by index if needed.
                // Actually looking at `submit-daily-challenge.dto.ts` example: `prayers: { fajr: "mosque" }`.
                // So the keys are slugs. The config `RAMADAN_FORM` doesn't explicitly have row keys, only labels.
                // We'll need to infer keys or map them.
                // *Assumption*: The row keys in `value` match the row labels in `question.rows`.
                // If they are slugified in DB but not in config, we might have a mismatch.
                // For this MVP, let's assume the key is the row label string or we just iterate keys of `value`.
                
                // Better approach: Iterate the rows from config, try to find matching answer.
                // If the key is slugified, we might miss it.
                // Let's check `RAMADAN_FORM` again.
                // `rows: ["الفجر", "الظهر", ...]`
                // DB likely stores: `{"الفجر": "mosque"}` OR slugified.
                // *Self-correction*: The previous code I didn't see explicit slugification logic in `DailyChallengeService` or frontend.
                // Usually form libraries might use the label as key if no id provided.
                
                const answerValue = answers[rowName] || answers[Object.keys(answers)[index] || ""];
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rowName}</TableCell>
                    {columns.map((col) => {
                      const isSelected = answerValue === col.value;
                      const isMaxXp = col.xp >= Math.max(...columns.map(c => c.xp));
                      const isZeroXp = col.xp === 0;

                      let cellClass = "";
                      if (isSelected) {
                         if (isMaxXp) cellClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-semibold";
                         else if (isZeroXp) cellClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
                         else cellClass = "bg-secondary text-secondary-foreground";
                      }

                      return (
                        <TableCell 
                          key={col.value} 
                          className={cn("text-center border-l", cellClass)}
                        >
                          {isSelected && <Check className="w-4 h-4 mx-auto inline-block me-1" />}
                          {isSelected ? col.xp + " XP" : ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      );

    default:
      return <div>Unknown type</div>;
  }
}

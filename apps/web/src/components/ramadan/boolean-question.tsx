import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface BooleanQuestionProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function BooleanQuestion({ value, onChange }: BooleanQuestionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-3 h-32",
          value === true
            ? "bg-primary/10 border-primary text-primary"
            : "bg-card hover:bg-muted/50 border-transparent shadow-sm",
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            value === true ? "bg-primary text-white" : "bg-muted",
          )}
        >
          <Check className="w-6 h-6" />
        </div>
        <span className="font-bold text-lg">نعم</span>
      </button>

      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all gap-3 h-32",
          value === false
            ? "bg-destructive/10 border-destructive text-destructive"
            : "bg-card hover:bg-muted/50 border-transparent shadow-sm",
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            value === false ? "bg-destructive text-white" : "bg-muted",
          )}
        >
          <X className="w-6 h-6" />
        </div>
        <span className="font-bold text-lg">لا</span>
      </button>
    </div>
  );
}

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface PrayerGridProps {
  rows: string[];
  columns: { label: string; value: string }[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function PrayerGrid({
  rows = [],
  columns = [],
  value = {},
  onChange,
}: PrayerGridProps) {
  const handleSelect = (rowLabel: string, colValue: string) => {
    onChange({ ...value, [rowLabel]: colValue });
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile View: Stacked Cards */}
      <div className="md:hidden space-y-4">
        {rows.map((row) => {
          const rowLabel = typeof row === "string" ? row : (row as any).label || (row as any).value || (row as any).id;
          const rowKey = typeof row === "string" ? row : (row as any).id || rowLabel;
          
          return (
            <div
              key={rowKey}
              className="bg-card border rounded-xl p-4 shadow-sm space-y-3"
            >
              <h3 className="font-bold text-lg text-primary">{rowLabel}</h3>
              <div className="grid grid-cols-2 gap-2">
                {columns.map((col) => {
                  const isSelected = value[rowLabel] === col.value;
                  return (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => handleSelect(rowLabel, col.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted/50",
                      )}
                    >
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 font-bold">الصلاة</th>
              {columns.map((col) => (
                <th key={col.value} className="p-4 font-medium text-center">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const rowLabel = typeof row === "string" ? row : (row as any).label || (row as any).value || (row as any).id;
              const rowKey = typeof row === "string" ? row : (row as any).id || rowLabel;

              return (
                <tr key={rowKey} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-bold text-primary w-1/5">{rowLabel}</td>
                  {columns.map((col) => {
                    const isSelected = value[rowLabel] === col.value;
                    return (
                      <td key={col.value} className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelect(rowLabel, col.value)}
                          className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center mx-auto transition-all",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground scale-110"
                              : "bg-background hover:border-primary/50",
                          )}
                        >
                          {isSelected && <Check className="w-5 h-5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

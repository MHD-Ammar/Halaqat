"use client";

import { useEffect, useState } from "react";

interface PageJumpInputProps {
  currentPage: number;
  maxPage?: number;
  onJump: (page: number) => void;
}

export function PageJumpInput({
  currentPage,
  maxPage = 604,
  onJump,
}: PageJumpInputProps) {
  const [value, setValue] = useState(String(currentPage));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValue(String(currentPage)), [currentPage]);

  const submit = () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > maxPage) {
      setError(`الصفحة يجب أن تكون بين 1 و ${maxPage}`);
      return;
    }
    setError(null);
    onJump(n);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          inputMode="numeric"
          aria-label="رقم الصفحة"
          className="h-9 w-24 rounded-md border bg-background px-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          انتقال
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

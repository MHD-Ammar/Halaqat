"use client";

/**
 * AsyncSelectField
 *
 * A Select dropdown whose options come from a TanStack Query fetch.
 * Handles loading and empty states automatically.
 */

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AsyncSelectFieldProps<T> {
  name: string;
  label: string;
  /** TanStack Query cache key */
  queryKey: readonly unknown[];
  /** Function that resolves the option list */
  queryFn: () => Promise<T[]>;
  getOptionValue: (item: T) => string;
  getOptionLabel: (item: T) => string;
  placeholder?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AsyncSelectField<T>({
  name,
  label,
  queryKey,
  queryFn,
  getOptionValue,
  getOptionLabel,
  placeholder = "اختر...",
  loadingLabel = "جاري التحميل...",
  emptyLabel = "لا توجد نتائج",
  description,
  required,
  disabled,
  className,
}: AsyncSelectFieldProps<T>) {
  const { control } = useFormContext();
  const { data: options = [], isLoading } = useQuery({ queryKey, queryFn });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          <FormLabel>
            {label}
            {required && (
              <span className="text-destructive me-1" aria-hidden="true">
                *
              </span>
            )}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled || isLoading}
          >
            <FormControl>
              <SelectTrigger id={field.name} aria-required={required}>
                {isLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {loadingLabel}
                  </span>
                ) : (
                  <SelectValue placeholder={placeholder} />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.length === 0 && !isLoading ? (
                <SelectItem value="__empty__" disabled>
                  {emptyLabel}
                </SelectItem>
              ) : (
                options.map((item) => {
                  const val = getOptionValue(item);
                  return (
                    <SelectItem key={val} value={val}>
                      {getOptionLabel(item)}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

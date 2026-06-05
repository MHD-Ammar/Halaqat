"use client";

/**
 * DateField
 *
 * Native `<input type="date">` bound to an ISO date string (YYYY-MM-DD).
 * Using a native date input keeps the bundle small and works well on mobile.
 */

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateFieldProps {
  name: string;
  label: string;
  min?: string; // "YYYY-MM-DD"
  max?: string; // "YYYY-MM-DD"
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateField({
  name,
  label,
  min,
  max,
  description,
  required,
  disabled,
  className,
}: DateFieldProps) {
  const { control } = useFormContext();

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
          <FormControl>
            <Input
              id={field.name}
              type="date"
              min={min}
              max={max}
              disabled={disabled}
              aria-required={required}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

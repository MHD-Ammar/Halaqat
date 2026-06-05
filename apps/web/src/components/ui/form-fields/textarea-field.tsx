"use client";

/**
 * TextareaField
 *
 * Multi-line text input with optional character counter.
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextareaFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TextareaField({
  name,
  label,
  placeholder,
  rows = 3,
  maxLength,
  showCharCount = false,
  description,
  required,
  disabled,
  className,
}: TextareaFieldProps) {
  const { control, watch } = useFormContext();
  const value: string = watch(name) ?? "";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          <div className="flex items-center justify-between">
            <FormLabel>
              {label}
              {required && (
                <span className="text-destructive me-1" aria-hidden="true">
                  *
                </span>
              )}
            </FormLabel>
            {showCharCount && maxLength && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {value.length}/{maxLength}
              </span>
            )}
          </div>
          <FormControl>
            <Textarea
              id={field.name}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              aria-required={required}
              className="resize-none"
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

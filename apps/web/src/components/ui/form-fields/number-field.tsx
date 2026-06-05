"use client";

/**
 * NumberField
 *
 * Numeric input with RHF value coercion (string → number).
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

export interface NumberFieldProps {
  name: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function NumberField({
  name,
  label,
  min,
  max,
  step = 1,
  description,
  required,
  disabled,
  className,
  placeholder,
}: NumberFieldProps) {
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
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required}
              {...field}
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

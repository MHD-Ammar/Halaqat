"use client";

/**
 * TextField
 *
 * A typed text / email / password / url input that reads from the nearest
 * FormProvider context. Renders label, input, description, and validation
 * error automatically.
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

export interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "url" | "tel";
  description?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  /** Filter the raw input value before passing to RHF (e.g. phone sanitizer). */
  sanitize?: (value: string) => string;
}

export function TextField({
  name,
  label,
  placeholder,
  type = "text",
  description,
  required,
  autoComplete,
  disabled,
  className,
  sanitize,
}: TextFieldProps) {
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
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-required={required}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                const val = sanitize ? sanitize(e.target.value) : e.target.value;
                field.onChange(val);
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

"use client";

/**
 * SelectField
 *
 * Dropdown built on the existing Radix Select primitives.
 * Accepts a typed `options` array — no loose string juggling in dialogs.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps<T extends string = string> {
  name: string;
  label: string;
  options: SelectOption<T>[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectField<T extends string = string>({
  name,
  label,
  options,
  placeholder = "اختر...",
  description,
  required,
  disabled,
  className,
}: SelectFieldProps<T>) {
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
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            {...(disabled !== undefined ? { disabled } : {})}
          >
            <FormControl>
              <SelectTrigger id={field.name} aria-required={required}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  {...(opt.disabled !== undefined ? { disabled: opt.disabled } : {})}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

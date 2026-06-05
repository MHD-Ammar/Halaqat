"use client";

/**
 * SwitchField
 *
 * Toggle switch rendered as a bordered row (label + description on the right,
 * switch on the left — RTL-aware).
 */

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface SwitchFieldProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function SwitchField({
  name,
  label,
  description,
  disabled,
  className,
}: SwitchFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between rounded-lg border p-4",
            className,
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              id={field.name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={label}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

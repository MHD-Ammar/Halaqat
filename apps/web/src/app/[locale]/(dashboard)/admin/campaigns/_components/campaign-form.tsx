"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * The `any` casts here are confined to react-hook-form's `control` and dynamic
 * `name` path strings for the discriminated-union `formConfig` array.
 * RHF cannot infer template-literal paths, so `as any` is the only safe escape.
 */

import type { FormQuestion, QuestionType } from "@halaqat/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/routing";
import type { Campaign, CreateCampaignDto } from "@/types/campaign";

// ─── Zod Schemas (matches FormQuestion from ChallengeConfig) ─────────────────

const columnOptionSchema = z.object({
  label: z.string().min(1, "Required"),
  value: z.string().min(1, "Required"),
  xp: z.coerce.number(),
});

const questionSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Required"),
    description: z.string().optional(),
    type: z.enum(["BOOLEAN", "NUMBER", "GRID", "SELECT"]),
    // BOOLEAN
    xpYes: z.coerce.number().optional(),
    xpNo: z.coerce.number().optional(),
    // NUMBER
    multiplier: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
    min: z.coerce.number().optional(),
    step: z.coerce.number().optional(),
    defaultValue: z.coerce.number().optional(),
    // GRID: rows as {value}[] for useFieldArray, converted to string[] on submit
    rows: z.array(z.object({ value: z.string() })).optional(),
    columns: z.array(columnOptionSchema).optional(),
    options: z.array(columnOptionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BOOLEAN") {
      if (data.xpYes === undefined) ctx.addIssue({ code: "custom", path: ["xpYes"], message: "Required for BOOLEAN" });
      if (data.xpNo === undefined) ctx.addIssue({ code: "custom", path: ["xpNo"], message: "Required for BOOLEAN" });
    }
    if (data.type === "GRID") {
      if (!data.rows || data.rows.length === 0)
        ctx.addIssue({ code: "custom", path: ["rows"], message: "At least one row required" });
      if (!data.columns || data.columns.length === 0)
        ctx.addIssue({ code: "custom", path: ["columns"], message: "At least one column required" });
    }
    if (data.type === "SELECT") {
      if (!data.options || data.options.length === 0)
        ctx.addIssue({ code: "custom", path: ["options"], message: "At least one option required" });
    }
    if (data.type === "NUMBER") {
      if (data.multiplier === undefined || data.multiplier < 0)
        ctx.addIssue({ code: "custom", path: ["multiplier"], message: "Multiplier required" });
    }
  });

const formSchema = z.object({
  title: z.string().min(2, "Required"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  isActive: z.boolean(),
  submittedXp: z.coerce.number().min(0),
  formConfig: z.array(questionSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface CampaignFormProps {
  initialData?: Campaign;
  onSubmit: (data: CreateCampaignDto) => Promise<void>;
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CampaignForm({ initialData, onSubmit, isLoading }: CampaignFormProps) {
  const t = useTranslations("AdminCampaigns");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const parseInitialConfig = (): FormValues["formConfig"] => {
    const config = initialData?.formConfig as Record<string, unknown> | unknown[] | undefined;
    if (!config) return [];

    const questionsArray: FormQuestion[] = Array.isArray(config)
      ? config
      : config.questions
        ? Array.isArray(config.questions)
          ? config.questions
          : Object.entries(config.questions).map(([id, q]: [string, any]) => ({ ...q, id }))
        : [];

    return questionsArray.map((q: any) => ({
      id: q.id || crypto.randomUUID(),
      title: q.title || "",
      description: q.description ?? "",
      type: (q.type || "BOOLEAN") as QuestionType,
      xpYes: q.type === "BOOLEAN" ? (q.xpYes ?? 10) : undefined,
      xpNo: q.type === "BOOLEAN" ? (q.xpNo ?? 0) : undefined,
      multiplier: q.type === "NUMBER" ? (q.multiplier ?? 1) : undefined,
      max: q.type === "NUMBER" ? (q.max ?? 10) : undefined,
      min: q.type === "NUMBER" ? (q.min ?? 0) : undefined,
      step: q.type === "NUMBER" ? (q.step ?? 1) : undefined,
      defaultValue: q.type === "NUMBER" ? (q.defaultValue ?? 0) : undefined,
      rows: q.type === "GRID"
        ? Array.isArray(q.rows)
          ? (q.rows as any[]).map((r) => (typeof r === "string" ? { value: r } : { value: r?.value ?? "" }))
          : []
        : [],
      columns: q.type === "GRID"
        ? (q.columns || []).map((c: any) => ({
            label: c.label || "",
            value: c.value || "",
            xp: c.xp ?? 0,
          }))
        : [],
      options: q.type === "SELECT"
        ? (q.options || []).map((o: any) => ({
            label: o.label || "",
            value: o.value || "",
            xp: o.xp ?? 0,
          }))
        : [],
    }));
  };

  const defaultValues: FormValues = {
    title: initialData?.title || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isActive: initialData?.isActive ?? false,
    submittedXp: (initialData?.formConfig as any)?.submitted_xp ?? 1,
    formConfig: parseInitialConfig(),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "formConfig",
  });

  const handleSubmit = async (values: FormValues) => {
    const questions: FormQuestion[] = values.formConfig.map((q): FormQuestion => {
      const id = q.id || crypto.randomUUID();
      // exactOptionalPropertyTypes: omit description entirely when falsy
      const base = {
        id,
        title: q.title,
        ...(q.description ? { description: q.description } : {}),
      };

      switch (q.type) {
        case "BOOLEAN":
          return { ...base, type: "BOOLEAN" as const, xpYes: Number(q.xpYes ?? 0), xpNo: Number(q.xpNo ?? 0) };
        case "NUMBER":
          return {
            ...base,
            type: "NUMBER" as const,
            multiplier: Number(q.multiplier ?? 1),
            ...(q.max !== null ? { max: Number(q.max) } : {}),
            ...(q.min !== null ? { min: Number(q.min) } : {}),
            ...(q.step !== null ? { step: Number(q.step) } : {}),
            ...(q.defaultValue !== null ? { defaultValue: Number(q.defaultValue) } : {}),
          };
        case "GRID": {
          const rawRows = q.rows || [];
          const rowStrings = rawRows
            .map((r: any) => (typeof r === "string" ? r : r?.value ?? ""))
            .filter(Boolean) as string[];
          return {
            ...base,
            type: "GRID" as const,
            rows: rowStrings,
            columns: (q.columns || []).map((c) => ({
              label: c.label,
              value: c.value,
              xp: Number(c.xp),
            })),
          };
        }
        case "SELECT":
          return {
            ...base,
            type: "SELECT" as const,
            options: (q.options || []).map((o) => ({
              label: o.label,
              value: o.value,
              xp: Number(o.xp),
            })),
          };
        default:
          return { ...base, type: "BOOLEAN" as const, xpYes: 0, xpNo: 0 };
      }
    });

    await onSubmit({
      title: values.title,
      startDate: values.startDate,
      endDate: values.endDate,
      isActive: values.isActive,
      formConfig: {
        submitted_xp: values.submittedXp,
        questions,
      } as any,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-8">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? tCommon("saving") : tCommon("save")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("formBuilder")}</CardTitle>
                <CardDescription>{t("formDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <QuestionBlock
                    key={field.id}
                    form={form}
                    index={index}
                    fieldsLength={fields.length}
                    onMoveUp={() => index > 0 && move(index, index - 1)}
                    onMoveDown={() => index < fields.length - 1 && move(index, index + 1)}
                    onRemove={() => remove(index)}
                    t={t}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      type: "BOOLEAN",
                      title: t("newQuestion"),
                      xpYes: 10,
                      xpNo: 0,
                    } as any)
                  }
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addQuestion")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tCommon("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("campaignTitle")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="submittedXp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("submissionXp")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} value={field.value ?? 1} />
                      </FormControl>
                      <FormDescription>{t("submissionXpDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("startDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("endDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t("active")}</FormLabel>
                        <FormDescription>{t("activeDescription")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

// ─── Question Block (with nested useFieldArray for GRID/SELECT) ──────────────

interface QuestionBlockProps {
  form: ReturnType<typeof useForm<FormValues>>;
  index: number;
  fieldsLength: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  t: (key: string, values?: any) => string;
}

function QuestionBlock({ form, index, fieldsLength, onMoveUp, onMoveDown, onRemove, t }: QuestionBlockProps) {
  const typeValue = form.watch(`formConfig.${index}.type`);

  // Rows stored as { value: string }[] for useFieldArray compatibility
  const rowsArray = useFieldArray({
    control: form.control,
    name: `formConfig.${index}.rows` as any,
  });

  const columnsArray = useFieldArray({
    control: form.control,
    name: `formConfig.${index}.columns` as any,
  });

  const optionsArray = useFieldArray({
    control: form.control,
    name: `formConfig.${index}.options` as any,
  });

  const isGrid = typeValue === "GRID";
  const isSelect = typeValue === "SELECT";

  // Ensure rows/columns/options exist when switching to GRID/SELECT
  const ensureNestedArrays = () => {
    const rows = form.getValues(`formConfig.${index}.rows`);
    const columns = form.getValues(`formConfig.${index}.columns`);
    const options = form.getValues(`formConfig.${index}.options`);
    if (isGrid) {
      if (!Array.isArray(rows) || rows.length === 0) form.setValue(`formConfig.${index}.rows` as any, [{ value: "" }]);
      if (!Array.isArray(columns) || columns.length === 0)
        form.setValue(`formConfig.${index}.columns` as any, [{ label: "", value: "", xp: 0 }]);
    }
    if (isSelect) {
      if (!Array.isArray(options) || options.length === 0)
        form.setValue(`formConfig.${index}.options` as any, [{ label: "", value: "", xp: 0 }]);
    }
  };

  return (
    <div
      className="border rounded-xl p-4 bg-muted/20 relative space-y-4 group"
      onFocus={ensureNestedArrays}
    >
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0} className="h-8 w-8">
          &uarr;
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={index === fieldsLength - 1}
          className="h-8 w-8"
        >
          &darr;
        </Button>
        <Button type="button" variant="destructive" size="icon" onClick={onRemove} className="h-8 w-8 ml-2">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <FormField
          control={form.control as any}
          name={`formConfig.${index}.title`}
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>{t("questionTitle")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control as any}
          name={`formConfig.${index}.type`}
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>{t("questionType")}</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v === "GRID") {
                    form.setValue(`formConfig.${index}.rows` as any, [{ value: "" }]);
                    form.setValue(`formConfig.${index}.columns` as any, [{ label: "", value: "", xp: 0 }]);
                  }
                  if (v === "SELECT") {
                    form.setValue(`formConfig.${index}.options` as any, [{ label: "", value: "", xp: 0 }]);
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BOOLEAN">{t("boolean")}</SelectItem>
                  <SelectItem value="NUMBER">{t("number")}</SelectItem>
                  <SelectItem value="SELECT">{t("select")}</SelectItem>
                  <SelectItem value="GRID">{t("grid")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control as any}
        name={`formConfig.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("questionDescription")}</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ""} placeholder={t("questionDescription")} rows={2} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {typeValue === "BOOLEAN" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.xpYes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("xpYes")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.xpNo`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("xpNo")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {typeValue === "NUMBER" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.multiplier`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("multiplier")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.max`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maxLimit")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("min")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.step`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("step")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 1} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name={`formConfig.${index}.defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("defaultValue")}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? 0} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}

      {typeValue === "GRID" && (
        <div className="space-y-4 border-l-2 border-muted pl-4">
          <h4 className="text-sm font-medium">{t("gridRows")}</h4>
          <div className="space-y-2">
            {(rowsArray.fields as { id: string }[]).map((row, ri) => (
              <div key={row.id} className="flex gap-2">
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.rows.${ri}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={t("rowLabel", { n: ri + 1 })} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => rowsArray.remove(ri)}
                  disabled={rowsArray.fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => rowsArray.append({ value: "" })}>
              <Plus className="mr-2 h-3 w-3" />
              {t("addRow")}
            </Button>
          </div>

          <h4 className="text-sm font-medium">{t("gridColumns")}</h4>
          <div className="space-y-2">
            {(columnsArray.fields as { id: string }[]).map((col, ci) => (
              <div key={col.id} className="grid grid-cols-4 gap-2 items-center">
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.columns.${ci}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t("columnLabel")} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.columns.${ci}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t("columnValue")} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.columns.${ci}.xp`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" placeholder="XP" {...field} value={field.value ?? 0} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => columnsArray.remove(ci)}
                  disabled={columnsArray.fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => columnsArray.append({ label: "", value: "", xp: 0 })}
            >
              <Plus className="mr-2 h-3 w-3" />
              {t("addColumn")}
            </Button>
          </div>
        </div>
      )}

      {typeValue === "SELECT" && (
        <div className="space-y-4 border-l-2 border-muted pl-4">
          <h4 className="text-sm font-medium">{t("addOption")}</h4>
          <div className="space-y-2">
            {(optionsArray.fields as { id: string }[]).map((opt, oi) => (
              <div key={opt.id} className="grid grid-cols-4 gap-2 items-center">
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.options.${oi}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t("optionLabel")} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.options.${oi}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t("optionValue")} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name={`formConfig.${index}.options.${oi}.xp`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" placeholder="XP" {...field} value={field.value ?? 0} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => optionsArray.remove(oi)}
                  disabled={optionsArray.fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => optionsArray.append({ label: "", value: "", xp: 0 })}
            >
              <Plus className="mr-2 h-3 w-3" />
              {t("addOption")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

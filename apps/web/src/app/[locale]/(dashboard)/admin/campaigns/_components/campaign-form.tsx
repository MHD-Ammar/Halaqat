"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/routing";
import type { Campaign, CreateCampaignDto, CampaignQuestion } from "@/types/campaign";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
const questionSchema = z.object({
  id: z.string().optional(), // optional for new
  title: z.string().min(1, "Required"),
  type: z.enum(["BOOLEAN", "NUMBER", "GRID"]),
  xpYes: z.coerce.number().optional(),
  xpNo: z.coerce.number().optional(),
  multiplier: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  gridTemplate: z.enum(["STANDARD_PRAYERS", "EMPTY"]).optional(),
});

const formSchema = z.object({
  title: z.string().min(2, "Required"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  isActive: z.boolean(),
  formConfig: z.array(questionSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────
interface CampaignFormProps {
  initialData?: Campaign;
  onSubmit: (data: CreateCampaignDto) => Promise<void>;
  isLoading?: boolean;
}

// ─── Helper for Grid Mapping ─────────────────────────────────────────────────
function buildGridFromTemplate(template: "STANDARD_PRAYERS" | "EMPTY" | undefined): Omit<CampaignQuestion, "id" | "title" | "type"> {
  if (template === "STANDARD_PRAYERS") {
    return {
      rows: [
        { id: "fajr", label: "Fajr" },
        { id: "dhuhr", label: "Dhuhr" },
        { id: "asr", label: "Asr" },
        { id: "maghrib", label: "Maghrib" },
        { id: "isha", label: "Isha" },
      ],
      columns: [
        { id: "mosque", label: "Mosque", xp: 10 },
        { id: "home", label: "Home", xp: 5 },
        { id: "late", label: "Late/Missed", xp: 0 },
      ],
    } as any;
  }
  return { rows: [], columns: [] } as any;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CampaignForm({ initialData, onSubmit, isLoading }: CampaignFormProps) {
  const t = useTranslations("AdminCampaigns");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  // Map initial config backwards for the form
  const defaultValues: FormValues = {
    title: initialData?.title || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    isActive: initialData?.isActive || false,
    formConfig: (() => {
      // The backend stores formConfig as { questions: { [id]: q }, submitted_xp: 10 }
      // But we need it as an array for the form
      const config = initialData?.formConfig as any;
      if (!config) return [];
      
      let questionsArray: any[] = [];
      if (Array.isArray(config)) {
        questionsArray = config;
      } else if (config.questions) {
        questionsArray = Object.entries(config.questions).map(([id, q]: [string, any]) => ({
          ...q,
          id,
        }));
      }

      return questionsArray.map((q: any) => {
        // detect if grid template
        let gridTemplate: "STANDARD_PRAYERS" | "EMPTY" = "EMPTY";
        if (q.type === "GRID") {
          const rows = q.rows || [];
          if (rows.length === 5 && (rows[0] === "fajr" || rows[0]?.id === "fajr")) {
            gridTemplate = "STANDARD_PRAYERS";
          }
        }

        return {
          id: q.id,
          title: q.title,
          type: q.type,
          xpYes: q.type === "BOOLEAN" ? q.xpYes : undefined,
          xpNo: q.type === "BOOLEAN" ? q.xpNo : undefined,
          multiplier: q.type === "NUMBER" ? q.multiplier : undefined,
          max: q.type === "NUMBER" ? q.max : undefined,
          gridTemplate: q.type === "GRID" ? gridTemplate : undefined,
        };
      });
    })(),
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
    const questionsMap: Record<string, any> = {};
    values.formConfig.forEach((q) => {
      const id = q.id || crypto.randomUUID();
      const base = {
        title: q.title,
      };

      if (q.type === "BOOLEAN") {
        questionsMap[id] = {
          ...base,
          type: "BOOLEAN",
          xpYes: Number(q.xpYes || 0),
          xpNo: Number(q.xpNo || 0),
        };
      } else if (q.type === "NUMBER") {
        questionsMap[id] = {
          ...base,
          type: "NUMBER",
          multiplier: Number(q.multiplier || 0),
          max: Number(q.max || 0),
        };
      } else {
        // GRID
        const gridSetup = buildGridFromTemplate(q.gridTemplate);
        // Also generate xpMap for backend convenience if it's the standard template
        let xpMap = undefined;
        if (q.gridTemplate === "STANDARD_PRAYERS") {
          xpMap = {
            mosque: 10,
            home: 5,
            late: 0,
          };
        }

        questionsMap[id] = {
          ...base,
          type: "GRID",
          ...gridSetup,
          xpMap,
        };
      }
    });

    await onSubmit({
      title: values.title,
      startDate: values.startDate,
      endDate: values.endDate,
      isActive: values.isActive,
      formConfig: {
        questions: questionsMap,
        submitted_xp: (initialData?.formConfig as any)?.submitted_xp || 10,
      } as any,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? tCommon("saving") : tCommon("save")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("formBuilder")}</CardTitle>
                <CardDescription>
                  Build your campaign&apos;s daily challenge format. Each block represents a question.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const typeValue = form.watch(`formConfig.${index}.type`);

                  return (
                    <div
                      key={field.id}
                      className="border rounded-xl p-4 bg-muted/20 relative space-y-4 group"
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => index > 0 && move(index, index - 1)}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          &uarr;
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => index < fields.length - 1 && move(index, index + 1)}
                          disabled={index === fields.length - 1}
                          className="h-8 w-8"
                        >
                          &darr;
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="h-8 w-8 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {/* Title */}
                        <FormField
                          control={form.control as any}
                          name={`formConfig.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                              <FormLabel>{t("questionTitle")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Type Selector */}
                        <FormField
                          control={form.control as any}
                          name={`formConfig.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                              <FormLabel>{t("questionType")}</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="BOOLEAN">{t("boolean")}</SelectItem>
                                  <SelectItem value="NUMBER">{t("number")}</SelectItem>
                                  <SelectItem value="GRID">{t("grid")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Dynamic Fields based on Type */}
                      {typeValue === "BOOLEAN" && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control as any}
                            name={`formConfig.${index}.xpYes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("xpYes")}</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
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
                                  <Input type="number" {...field} />
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
                                  <Input type="number" {...field} />
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
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {typeValue === "GRID" && (
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control as any}
                            name={`formConfig.${index}.gridTemplate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("gridTemplate")}</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="STANDARD_PRAYERS">
                                      {t("standardPrayers")}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      type: "BOOLEAN",
                      title: "New Question",
                      xpYes: 10,
                      xpNo: 0,
                    })
                  }
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addQuestion")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
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
                        <Input {...field} />
                      </FormControl>
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
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
                        <FormDescription>
                          Make this campaign active globally.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
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

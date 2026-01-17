"use client";

/**
 * StudentActionSheet Component
 *
 * Bottom sheet for recording student recitations.
 * Features: Surah search, verse inputs, quality grading buttons.
 */

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ChevronsUpDown,
  BookOpen,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { RecitationType, RecitationQuality } from "@halaqat/types";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSurahs, type Surah } from "@/hooks/use-surahs";
import { useRecordRecitation } from "@/hooks/use-record-recitation";

/**
 * Zod schema for recitation form validation
 */
const recitationSchema = z
  .object({
    type: z.nativeEnum(RecitationType),
    surahId: z.number().min(1, "Please select a Surah"),
    startVerse: z.number().min(1, "Start verse must be at least 1"),
    endVerse: z.number().min(1, "End verse must be at least 1"),
    quality: z.nativeEnum(RecitationQuality),
  })
  .refine((data) => data.endVerse >= data.startVerse, {
    message: "End verse must be greater than or equal to start verse",
    path: ["endVerse"],
  });

type RecitationFormData = z.infer<typeof recitationSchema>;

/**
 * Quality button configuration
 */
const QUALITY_OPTIONS: {
  value: RecitationQuality;
  label: string;
  color: string;
  points: number;
}[] = [
  {
    value: RecitationQuality.EXCELLENT,
    label: "Excellent",
    color: "bg-emerald-500 hover:bg-emerald-600 text-white",
    points: 5,
  },
  {
    value: RecitationQuality.VERY_GOOD,
    label: "V. Good",
    color: "bg-blue-500 hover:bg-blue-600 text-white",
    points: 3,
  },
  {
    value: RecitationQuality.GOOD,
    label: "Good",
    color: "bg-yellow-500 hover:bg-yellow-600 text-white",
    points: 1,
  },
  {
    value: RecitationQuality.ACCEPTABLE,
    label: "Acceptable",
    color: "bg-orange-500 hover:bg-orange-600 text-white",
    points: 0,
  },
  {
    value: RecitationQuality.POOR,
    label: "Poor",
    color: "bg-red-500 hover:bg-red-600 text-white",
    points: 0,
  },
];

interface StudentActionSheetProps {
  student: {
    id: string;
    name: string;
  };
  sessionId: string;
  circleId: string;
  children: React.ReactNode;
}

export function StudentActionSheet({
  student,
  sessionId,
  circleId,
  children,
}: StudentActionSheetProps) {
  const [open, setOpen] = useState(false);
  const [surahOpen, setSurahOpen] = useState(false);
  const { toast } = useToast();

  // Fetch Surahs
  const { data: surahs = [], isLoading: surahsLoading } = useSurahs();

  // Mutation
  const recordMutation = useRecordRecitation(circleId);

  // Form
  const form = useForm<RecitationFormData>({
    resolver: zodResolver(recitationSchema),
    defaultValues: {
      type: RecitationType.NEW_LESSON,
      surahId: 0,
      startVerse: 1,
      endVerse: 1,
      quality: undefined,
    },
  });

  // Selected Surah for display
  const selectedSurah = useMemo(() => {
    return surahs.find((s: Surah) => s.id === form.watch("surahId"));
  }, [surahs, form.watch("surahId")]);

  // Max verse count for selected Surah
  const maxVerseCount = selectedSurah?.verseCount || 999;

  // Handle form submit
  const onSubmit = async (data: RecitationFormData) => {
    try {
      await recordMutation.mutateAsync({
        studentId: student.id,
        sessionId,
        surahId: data.surahId,
        startVerse: data.startVerse,
        endVerse: data.endVerse,
        type: data.type,
        quality: data.quality,
      });

      // Find points for the quality
      const points =
        QUALITY_OPTIONS.find((q) => q.value === data.quality)?.points || 0;

      toast({
        title: "Recitation saved!",
        description: points > 0 ? `+${points} Points awarded` : "Recorded successfully",
      });

      // Close sheet and reset form
      setOpen(false);
      form.reset();
    } catch {
      toast({
        title: "Error saving recitation",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] md:h-auto md:max-h-[85vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Record Recitation - {student.name}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6 pb-6"
          >
            {/* Lesson Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Type</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as RecitationType)
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value={RecitationType.NEW_LESSON}>
                          New Lesson (Hifz)
                        </TabsTrigger>
                        <TabsTrigger value={RecitationType.REVIEW}>
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Review
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Surah Selection - Combobox */}
            <FormField
              control={form.control}
              name="surahId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Surah</FormLabel>
                  <Popover open={surahOpen} onOpenChange={setSurahOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={surahOpen}
                          className="w-full justify-between h-11"
                          disabled={surahsLoading}
                        >
                          {surahsLoading ? (
                            <span className="text-muted-foreground">
                              Loading...
                            </span>
                          ) : selectedSurah ? (
                            <span>
                              {selectedSurah.number}. {selectedSurah.nameEnglish}{" "}
                              <span className="text-muted-foreground">
                                ({selectedSurah.nameArabic})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Select a Surah...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search Surah..." />
                        <CommandList>
                          <CommandEmpty>No Surah found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {surahs.map((surah: Surah) => (
                              <CommandItem
                                key={surah.id}
                                value={`${surah.number} ${surah.nameEnglish} ${surah.nameArabic}`}
                                onSelect={() => {
                                  field.onChange(surah.id);
                                  setSurahOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === surah.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="font-medium mr-2">
                                  {surah.number}.
                                </span>
                                {surah.nameEnglish}
                                <span className="ml-2 text-muted-foreground">
                                  {surah.nameArabic}
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {surah.verseCount} verses
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Verses - Start and End */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startVerse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Verse</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={maxVerseCount}
                        className="h-11"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endVerse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Verse</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={maxVerseCount}
                        className="h-11"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quality Rating - Large Buttons */}
            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Rating</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2">
                      {QUALITY_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-14 flex flex-col items-center justify-center text-xs font-medium transition-all",
                            field.value === option.value
                              ? option.color
                              : "hover:opacity-80"
                          )}
                          onClick={() => field.onChange(option.value)}
                        >
                          <span>{option.label}</span>
                          {option.points > 0 && (
                            <span className="text-[10px] opacity-75">
                              +{option.points}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TODO: Auto-Increment Suggestion
             * Future feature: If the student recited "Al-Baqara 1-10" yesterday,
             * default the inputs to "Al-Baqara 11-..." based on their last recitation.
             */}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={recordMutation.isPending || !form.formState.isValid}
            >
              {recordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Recitation"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

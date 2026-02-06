"use client";

/**
 * Setup Welcome Page (Step 1)
 *
 * First step of the setup wizard:
 * - Welcome message with teacher's name
 * - Circle name input
 * - Creates circle and redirects to students page
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth, useMyCircles, useCreateCircle } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";

export default function SetupWelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Setup");
  const tCommon = useTranslations("Common");
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: circles, isLoading: isCirclesLoading } = useMyCircles();
  const createCircle = useCreateCircle();
  const [hasCheckedCircles, setHasCheckedCircles] = useState(false);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);

  // Redirect to overview if user already has circles (but NOT if we're in the process of creating one)
  useEffect(() => {
    if (isCreatingCircle) return; // Skip check during circle creation

    if (!isCirclesLoading && circles && circles.length > 0) {
      router.replace("/overview");
    } else if (!isCirclesLoading) {
      setHasCheckedCircles(true);
    }
  }, [circles, isCirclesLoading, router, isCreatingCircle]);

  // Form schema
  const formSchema = z.object({
    name: z.string().min(2, tCommon("name") + " مطلوب"),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Set flag to prevent redirect check
    setIsCreatingCircle(true);

    try {
      // Create the circle
      const circle = await createCircle.mutateAsync({
        name: data.name,
        gender: "MALE", // Default to male, can be changed later
        teacherId: user?.id || "",
      });

      toast({
        title: tCommon("success"),
        description: t("circleCreated", { name: data.name }),
      });

      // Store circle ID for next step and navigate
      sessionStorage.setItem("setup_circleId", circle.id);
      sessionStorage.setItem("setup_circleName", circle.name);
      router.push("/setup/students");
    } catch (error: unknown) {
      setIsCreatingCircle(false);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: axiosError.response?.data?.message || tCommon("error"),
      });
    }
  };

  // Show loading while checking
  if (isAuthLoading || isCirclesLoading || !hasCheckedCircles) {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Get user's first name for personalized greeting
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl">
          {t("welcomeTitle", { name: firstName })}
        </CardTitle>
        <CardDescription className="text-lg">
          {t("welcomeSubtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Circle Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t("circleName")}
            </label>
            <Input
              id="name"
              type="text"
              placeholder={t("circleNamePlaceholder")}
              disabled={isSubmitting}
              className="text-lg py-6"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-6 text-lg"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="me-2 h-5 w-5 animate-spin" />}
            {t("continue")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

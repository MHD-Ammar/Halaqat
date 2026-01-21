/**
 * Register Page
 *
 * User registration with react-hook-form and zod validation.
 */

"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing"; // Use locale-aware router
import { Link } from "@/i18n/routing"; // Use locale-aware Link
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Register");
  const tCommon = useTranslations("Common");
  const tAuth = useTranslations("Auth");

  // Define schema inside component to use translations
  const registerSchema = z.object({
    fullName: z.string().min(2, tAuth("validEmail")), // reusing validEmail generic error or simple min length
    email: z.string().email(tAuth("validEmail")),
    phoneNumber: z.string().min(10, tCommon("phone") + " invalid"), // simplified for now
    password: z.string().min(6, tAuth("passwordMinLength")),
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Register the user
      await authService.register(data);

      toast({
        title: tCommon("success"),
        description: tAuth("loginSuccessDescription"), // Reuse similar message
      });

      // Redirect to login
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.message || tCommon("error");

      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t("title")}</CardTitle>
        <CardDescription className="text-center">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              {tCommon("name")}
            </label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Ahmad Muhammad"
              disabled={isLoading}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {tCommon("email")}
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={tAuth("emailPlaceholder")}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number Field (Required) */}
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="text-sm font-medium">
              {tCommon("phone")}
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+966 50 123 4567"
              disabled={isLoading}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {tCommon("password")}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={tAuth("passwordPlaceholder")}
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isLoading ? tCommon("loading") : tCommon("create")}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-center text-muted-foreground">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            {tAuth("signIn")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

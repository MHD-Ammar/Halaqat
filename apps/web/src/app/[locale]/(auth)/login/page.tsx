/**
 * Login Page
 *
 * Authentication page with react-hook-form and zod validation.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";

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
import { TOKEN_COOKIE_NAME } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth");

  // Create validation schema with translated messages
  const loginSchema = z.object({
    email: z.string().email(t("validEmail")),
    password: z.string().min(6, t("passwordMinLength")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.login(data);

      // Store token in cookie (7 days expiry)
      Cookies.set(TOKEN_COOKIE_NAME, response.accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      toast({
        title: t("loginSuccess"),
        description: t("loginSuccessDescription"),
      });

      // Decode token to get role for smart redirect
      const tokenParts = response.accessToken.split(".");
      const tokenPayload = JSON.parse(atob(tokenParts[1] as string));
      const userRole = tokenPayload.role;

      // Smart redirect based on role
      let redirectPath = "/overview";
      switch (userRole) {
        case "ADMIN":
        case "SUPERVISOR":
          redirectPath = "/overview";
          break;
        case "TEACHER":
          redirectPath = "/my-circle";
          break;
        case "EXAMINER":
          redirectPath = "/exams";
          break;
        case "STUDENT":
          redirectPath = "/student-portal";
          break;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("invalidCredentials");

      toast({
        variant: "destructive",
        title: t("loginFailed"),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {t("welcomeBack")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("signInDescription")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("password")}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
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
            {isLoading ? t("signingIn") : t("signIn")}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-center text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            {t("signUp")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

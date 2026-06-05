/**
 * Student Login Page
 *
 * Kid-friendly login page with colorful design, large inputs, and playful UI.
 * Uses username + password (no email) for student authentication.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { Loader2, Rocket, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { TOKEN_COOKIE_NAME } from "@/lib/api";
import { routes } from "@/lib/constants/routes";
import { authService } from "@/services/auth.service";


export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("StudentLogin");

  const loginSchema = z.object({
    username: z.string().min(1, t("usernameRequired")),
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
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.studentLogin(data);

      Cookies.set(TOKEN_COOKIE_NAME, response.accessToken, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });

      toast({
        title: t("loginSuccess"),
        description: t("loginSuccessDesc"),
      });

      router.push(routes.studentPortal());
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: t("loginFailed"),
        description: t("invalidCredentials"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-login-page min-h-screen flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="student-login-bg" />

      {/* Floating decorative elements */}
      <div className="student-login-stars">
        {[...Array(12)].map((_, i) => (
          <Star
            key={i}
            className="student-login-star"
            fill="currentColor"
            strokeWidth={1.5}
            style={{
              left: `${(i * 137) % 100}%`,
              top: `${(i * 157) % 100}%`,
              animationDelay: `${i * 0.3}s`,
              width: `${12 + (i % 4) * 6}px`,
              height: `${12 + (i % 4) * 6}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 w-full max-w-sm">
        {/* Logo / Mascot Area */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 mb-4 animate-bounce-slow">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                👤 {t("username")}
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder={t("usernamePlaceholder")}
                disabled={isLoading}
                className="h-12 text-base rounded-xl border-2 focus:border-orange-400 transition-colors"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                🔑 {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                disabled={isLoading}
                className="h-12 text-base rounded-xl border-2 focus:border-orange-400 transition-colors"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-12 flex text-base font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              {isLoading && <Loader2 className="me-2 h-5 w-5 animate-spin" />}
              {isLoading ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground">
            {t("helpText")}
          </p>
        </div>
      </div>

    </div>
  );
}

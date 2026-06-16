/**
 * Landing Page
 *
 * Simple landing page with redirect to login.
 */

import {
  BookOpen,
  Users,
  Calendar,
  ArrowRight,
  GraduationCap,
  Rocket,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent />;
}

function HomePageContent() {
  const t = useTranslations("Landing");
  const tHeader = useTranslations("Header");
  const tAuth = useTranslations("Auth");

  const FEATURES = [
    {
      icon: BookOpen,
      titleKey: "studyCircles",
      descKey: "studyCirclesDesc",
    },
    {
      icon: Users,
      titleKey: "studentTracking",
      descKey: "studentTrackingDesc",
    },
    {
      icon: Calendar,
      titleKey: "scheduling",
      descKey: "schedulingDesc",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <Image
                src="/halaqat.png"
                alt="Halaqat Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-foreground">
              {tHeader("halaqat")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost">{tAuth("signIn")}</Button>
            </Link>
            <Link href="/register">
              <Button>{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("heroTitle")}
            <span className="text-primary"> {t("heroHighlight")}</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {t("heroDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                {t("getStarted")}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {t("learnMore")}
            </Button>
          </div>
        </div>

        {/* Role selection */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("chooseRoleTitle")}
            </h2>
            <p className="text-muted-foreground">{t("chooseRoleSubtitle")}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Student card */}
            <Link href="/student-login" className="group">
              <div className="h-full bg-card border-2 rounded-2xl p-8 text-center transition-all duration-300 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {t("studentRole")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("studentRoleDesc")}
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {t("enterAsStudent")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            </Link>

            {/* Teacher card */}
            <Link href="/login" className="group">
              <div className="h-full bg-card border-2 rounded-2xl p-8 text-center transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {t("teacherRole")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("teacherRoleDesc")}
                </p>
                <Button size="lg" variant="outline" className="w-full">
                  {t("enterAsTeacher")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.titleKey}
                className="bg-card border rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

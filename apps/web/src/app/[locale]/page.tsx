/**
 * Landing Page
 *
 * Simple landing page with redirect to login.
 */

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

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
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                ح
              </span>
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

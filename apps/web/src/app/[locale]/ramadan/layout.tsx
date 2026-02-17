import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const cairo = Cairo({ subsets: ["arabic"] });

export default async function RamadanLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <div
      className={cn(
        "min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-slate-900 text-white",
        cairo.className,
      )}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header / Nav could go here */}
          <header className="p-6 text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-md">
              🌙 تحدي رمضان
            </h1>
          </header>

          <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8">
            {children}
          </main>

          <Toaster />
        </div>

        {/* Decorative Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </NextIntlClientProvider>
    </div>
  );
}

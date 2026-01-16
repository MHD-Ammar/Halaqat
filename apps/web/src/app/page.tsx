/**
 * Landing Page
 * 
 * Simple landing page with redirect to login.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Study Circles",
    description: "Manage and organize your Halaqat efficiently",
  },
  {
    icon: Users,
    title: "Student Tracking",
    description: "Track attendance and progress of your students",
  },
  {
    icon: Calendar,
    title: "Scheduling",
    description: "Plan and schedule your teaching sessions",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">ح</span>
            </div>
            <span className="text-xl font-bold text-foreground">Halaqat</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Manage Your Mosque&apos;s
            <span className="text-primary"> Study Circles</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Halaqat helps teachers and administrators organize Quran study circles,
            track student progress, and manage attendance with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card border rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

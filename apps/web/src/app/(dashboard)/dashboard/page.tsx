/**
 * Dashboard Home Page
 * 
 * Main dashboard overview for teachers and admins.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, TrendingUp } from "lucide-react";

const STATS = [
  {
    title: "Active Circles",
    value: "3",
    description: "Your study circles",
    icon: BookOpen,
    color: "text-primary",
  },
  {
    title: "Total Students",
    value: "24",
    description: "Across all circles",
    icon: Users,
    color: "text-blue-500",
  },
  {
    title: "Sessions Today",
    value: "2",
    description: "Scheduled",
    icon: Calendar,
    color: "text-amber-500",
  },
  {
    title: "Attendance Rate",
    value: "92%",
    description: "This month",
    icon: TrendingUp,
    color: "text-emerald-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your circles today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Take Attendance
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
            Add Student
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
            Schedule Session
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

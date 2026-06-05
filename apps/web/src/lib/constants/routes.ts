/**
 * Typed Route Builder
 *
 * Single source of truth for every client-side route in the web app.
 * Use these helpers everywhere instead of hardcoded path strings so that
 * routes are refactorable, autocompletable, and type-safe.
 *
 * NOTE: Routes do NOT include the locale prefix — Next.js i18n middleware
 * injects the locale automatically.  If you need an absolute path with
 * locale, use `/${locale}${routes.login()}`.
 *
 * Usage:
 *   import { routes } from "@/lib/constants/routes";
 *   <Link href={routes.circle("abc-123")} />
 *   router.push(routes.student("def-456"));
 */

export const routes = {
  // ── Auth ───────────────────────────────────────────────────────────
  login:        () => "/login" as const,
  register:     () => "/register" as const,
  studentLogin: () => "/student-login" as const,

  // ── Setup wizard ───────────────────────────────────────────────────
  setupWelcome:  () => "/setup/welcome" as const,
  setupStudents: () => "/setup/students" as const,
  setupFinish:   () => "/setup/finish" as const,

  // ── Dashboard (admin / supervisor / teacher shared) ────────────────
  dashboard:  () => "/overview" as const,
  overview:   () => "/overview" as const,
  challenges: () => "/overview/challenges" as const,
  profile:    () => "/profile" as const,

  // ── Admin ──────────────────────────────────────────────────────────
  adminUsers:        () => "/admin/users" as const,
  adminSettings:     () => "/admin/settings" as const,
  adminGamification: () => "/admin/gamification" as const,
  adminChallenges:   () => "/admin/challenges" as const,
  adminCampaigns:    () => "/admin/campaigns" as const,
  adminCampaignCreate: () => "/admin/campaigns/create" as const,
  adminCampaignEdit:   (id: string) => `/admin/campaigns/${id}/edit` as string,

  // ── Circles ────────────────────────────────────────────────────────
  circles:    () => "/circles" as const,
  circle:     (id: string) => `/circles/${id}` as string,
  myCircle:   () => "/my-circle" as const,
  myQuests:   () => "/my-circle/quests" as const,

  // ── Students ───────────────────────────────────────────────────────
  students:      () => "/students" as const,
  student:       (id: string) => `/students/${id}` as string,
  myStudents:    () => "/my-students" as const,

  // ── Exams ──────────────────────────────────────────────────────────
  exams:         () => "/exams" as const,
  exam:          (id: string) => `/exams/${id}` as string,
  examNew:       (studentId: string) => `/exams/${studentId}/new` as string,
  examSession:   (id: string) => `/exams/${id}/session` as string,
  examJuz:       (id: string, juzNumber: number) => `/exams/${id}/juz/${juzNumber}` as string,

  // ── Student portal ─────────────────────────────────────────────────
  studentPortal:             () => "/student-portal" as const,
  studentPortalAchievements: () => "/student-portal/achievements" as const,
  studentPortalLeaderboard:  () => "/student-portal/leaderboard" as const,
  studentPortalMushaf:       (page?: number) =>
    page !== undefined
      ? `/student-portal/mushaf?page=${page}`
      : "/student-portal/mushaf",
  studentPortalQuests: () => "/student-portal/quests" as const,
  studentPortalStore:  () => "/student-portal/store" as const,

  // ── Ramadan / public challenge ─────────────────────────────────────
  ramadan:            () => "/ramadan" as const,
  ramadanLeaderboard: () => "/ramadan/leaderboard" as const,
} as const;

export type Routes = typeof routes;

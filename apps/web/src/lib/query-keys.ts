/**
 * Centralized Query Key Registry
 *
 * Every React Query key used across the app is defined here.
 * This gives us:
 *  - Predictable invalidation (one source of truth)
 *  - TypeScript autocomplete on key shapes
 *  - Easy grep: `queryKeys.` to find every key usage
 *
 * Convention:
 *   `.all`    – the broadest key for the resource (invalidates everything)
 *   `.list()` – the paginated / filtered list
 *   `.detail(id)` – a single item
 *
 * Keys are `as const` tuples so React Query can compare them correctly.
 */

export const queryKeys = {
  // ── Auth / User ───────────────────────────────────────────────────────
  auth: {
    all: ["auth"] as const,
    profile: () => ["user", "profile"] as const,
  },

  // ── Admin: Gamification ──────────────────────────────────────────────
  adminQuests: {
    all: ["admin", "quests"] as const,
    list: () => [...(["admin", "quests"] as const), "list"] as const,
    detail: (id: string) => [...(["admin", "quests"] as const), "detail", id] as const,
  },

  adminMilestones: {
    all: ["admin", "milestones"] as const,
    list: () => [...(["admin", "milestones"] as const), "list"] as const,
    detail: (id: string) => [...(["admin", "milestones"] as const), "detail", id] as const,
  },

  adminAchievements: {
    all: ["admin", "achievements"] as const,
    list: () => [...(["admin", "achievements"] as const), "list"] as const,
    detail: (id: string) => [...(["admin", "achievements"] as const), "detail", id] as const,
  },

  adminEvents: {
    all: ["admin", "events"] as const,
    list: () => [...(["admin", "events"] as const), "list"] as const,
    detail: (id: string) => [...(["admin", "events"] as const), "detail", id] as const,
    quests: (eventId: string) =>
      [...(["admin", "events"] as const), "detail", eventId, "quests"] as const,
  },

  adminFulfillments: {
    all: ["admin", "fulfillments"] as const,
    list: () => [...(["admin", "fulfillments"] as const), "list"] as const,
  },

  adminStoreItems: {
    all: ["admin", "store-items"] as const,
    list: () => [...(["admin", "store-items"] as const), "list"] as const,
    detail: (id: string) => [...(["admin", "store-items"] as const), "detail", id] as const,
  },

  // ── Admin Stats / Analytics ───────────────────────────────────────────
  adminStats: {
    all: ["admin-stats"] as const,
    overview: () => ["analytics", "overview"] as const,
    teacherDashboard: (from: string, to: string) =>
      ["analytics", "teacher-dashboard", from, to] as const,
    teacherPerformance: (teacherId: string, from: string, to: string) =>
      ["analytics", "teacher-performance", teacherId, from, to] as const,
    teacherStats: (teacherId: string) =>
      ["analytics", "teacher-stats", teacherId] as const,
  },

  // ── Admin Challenges ─────────────────────────────────────────────────
  adminChallenges: {
    all: ["admin-challenges"] as const,
    list: (page: number, startDate: string, endDate: string, campaign: string) =>
      ["admin-challenges", "list", page, startDate, endDate, campaign] as const,
  },

  // ── Campaigns ────────────────────────────────────────────────────────
  campaigns: {
    all: ["campaigns"] as const,
    list: () => [...(["campaigns"] as const), "list"] as const,
    detail: (id: string) => [...(["campaigns"] as const), "detail", id] as const,
  },

  // ── Students ─────────────────────────────────────────────────────────
  students: {
    all: ["students"] as const,
    list: (params?: unknown) =>
      [...(["students"] as const), "list", params] as const,
    unassigned: (search?: string) =>
      [...(["students"] as const), "unassigned", search] as const,
    byCircle: (circleId: string) =>
      [...(["students"] as const), "by-circle", circleId] as const,
    detail: (id: string) => [...(["students"] as const), "detail", id] as const,
    profile: (id: string) => [...(["students"] as const), "profile", id] as const,
    exams: (id: string) => [...(["students"] as const), "exams", id] as const,
    examCard: (id: string) => [...(["students"] as const), "exam-card", id] as const,
  },

  // ── Circles ──────────────────────────────────────────────────────────
  circles: {
    all: ["circles"] as const,
    list: () => [...(["circles"] as const), "list"] as const,
    myList: () => [...(["circles"] as const), "my-list"] as const,
    detail: (id: string) => [...(["circles"] as const), "detail", id] as const,
  },

  // ── Exams ────────────────────────────────────────────────────────────
  exams: {
    all: ["exams"] as const,
    recent: () => [...(["exams"] as const), "recent"] as const,
    search: (q: string) => [...(["exams"] as const), "search", q] as const,
    detail: (id: string) => [...(["exams"] as const), id] as const,
    forStudent: (studentId: string) =>
      [...(["exams"] as const), "student", studentId] as const,
    cardForStudent: (studentId: string) =>
      [...(["exams"] as const), "card", studentId] as const,
  },

  // ── Daily Challenge ───────────────────────────────────────────────────
  dailyChallenge: {
    all: ["daily-challenge"] as const,
    activeCampaign: () =>
      [...(["daily-challenge"] as const), "active-campaign"] as const,
    circles: (mosqueId: string) =>
      [...(["daily-challenge"] as const), "circles", mosqueId] as const,
    students: (circleId: string) =>
      [...(["daily-challenge"] as const), "students", circleId] as const,
    studentInfo: (studentId: string, campaign: string) =>
      [...(["daily-challenge"] as const), "student-info", studentId, campaign] as const,
    leaderboard: (mosqueId: string, campaign: string) =>
      [...(["daily-challenge"] as const), "leaderboard", mosqueId, campaign] as const,
    weekly: (circleId: string, startDate: string, campaign: string) =>
      [...(["daily-challenge"] as const), "weekly", circleId, startDate, campaign] as const,
    submission: (id: string) =>
      [...(["daily-challenge"] as const), "submission", id] as const,
  },

  // ── Mushaf ────────────────────────────────────────────────────────────
  mushaf: {
    all: ["mushaf"] as const,
    page: (pageNumber: number) => [...(["mushaf"] as const), "page", pageNumber] as const,
    myState: () => [...(["mushaf"] as const), "state", "me"] as const,
    studentState: (studentId: string) =>
      [...(["mushaf"] as const), "student-state", studentId] as const,
    studentMistakes: (studentId: string, pageNumber: number) =>
      [...(["mushaf"] as const), "mistakes", studentId, pageNumber] as const,
  },

  // ── Store Items ───────────────────────────────────────────────────────
  storeItems: {
    all: ["store-items"] as const,
    list: () => [...(["store-items"] as const), "list"] as const,
    detail: (id: string) => [...(["store-items"] as const), "detail", id] as const,
  },

  // ── Student Store (student-facing) ────────────────────────────────────
  studentStore: {
    all: ["student-store-items"] as const,
  },

  // ── Teachers ──────────────────────────────────────────────────────────
  teachers: {
    all: ["teachers"] as const,
    list: () => [...(["teachers"] as const), "list"] as const,
    byRole: () => ["users", "teachers"] as const,
    quests: (teacherId: string) =>
      [...(["teachers"] as const), "quests", teacherId] as const,
    rewards: (teacherId: string) =>
      [...(["teachers"] as const), "rewards", teacherId] as const,
  },

  // ── Users ─────────────────────────────────────────────────────────────
  users: {
    all: ["users"] as const,
    list: (params?: unknown) => ["users", params] as const,
    profile: () => ["user", "profile"] as const,
  },

  // ── Sessions ─────────────────────────────────────────────────────────
  sessions: {
    all: ["session"] as const,
    today: (circleId: string) => ["session", "today", circleId] as const,
    history: (circleId: string, limit: number) =>
      ["sessions", "history", circleId, limit] as const,
  },

  // ── Student Portal ────────────────────────────────────────────────────
  studentPortal: {
    all: ["student-portal"] as const,
    dashboard: (studentId: string) => ["student-portal", studentId] as const,
    milestones: () => ["student-milestones"] as const,
    achievements: () => ["student-achievements"] as const,
    leaderboard: {
      circle: () => ["student-leaderboard", "circle"] as const,
      mosque: () => ["student-leaderboard", "mosque"] as const,
      league: () => ["student-leaderboard", "league"] as const,
    },
    quests: {
      all: ["student-quests"] as const,
      grouped: () => ["student-quests", "grouped"] as const,
      today: (campaignKey?: string) =>
        ["student-quests", "today", campaignKey ?? "ramadan"] as const,
    },
  },

  // ── Curriculum ────────────────────────────────────────────────────────
  curriculum: {
    all: ["curriculum"] as const,
    surahs: () => ["curriculum", "surahs"] as const,
    surahsWithPages: () => ["surahs", "with-pages"] as const,
  },

  // ── Settings ─────────────────────────────────────────────────────────
  settings: {
    mosque: () => ["mosque", "my-mosque"] as const,
    pointRules: () => ["points", "rules"] as const,
  },

  // ── Recitations ───────────────────────────────────────────────────────
  recitations: {
    all: ["recitations"] as const,
  },
} as const;

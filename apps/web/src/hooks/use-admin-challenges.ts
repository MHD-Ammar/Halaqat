import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubmissionCell {
  id: string;
  xp: number;
  streak: number;
}

interface AdminStudentRow {
  student: {
    id: string;
    name: string;
    circleName: string | null;
  };
  submissions: Record<string, SubmissionCell>;
}

interface AdminListResponse {
  data: AdminStudentRow[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const adminChallengeKeys = {
  all: ["admin-challenges"] as const,
  list: (page: number, startDate: string, endDate: string, campaign: string) =>
    [...adminChallengeKeys.all, "list", page, startDate, endDate, campaign] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAdminChallengesList(
  page: number,
  startDate: string,
  endDate: string,
  campaign: string = "ramadan",
  limit: number = 20,
) {
  return useQuery({
    queryKey: adminChallengeKeys.list(page, startDate, endDate, campaign),
    queryFn: async () => {
      const data = await apiClient.get<AdminListResponse>(
        "/daily-challenge/submissions/admin-list",
        {
          params: { page, limit, startDate, endDate, campaign },
        },
      );
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useOverrideSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { xpEarned?: number; submissionData?: unknown } }) => {
      return apiClient.patch(`/daily-challenge/submissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminChallengeKeys.all });
      // We also might want to invalidate the specific submission detail
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyChallenge.all }); 
    },
  });
}

// ─── Excel Download ──────────────────────────────────────────────────────────

export async function downloadChallengesExcel(
  startDate: string,
  endDate: string,
  campaign: string = "ramadan",
) {
  const data = await apiClient.get("/daily-challenge/export/excel", {
    params: { startDate, endDate, campaign },
    responseType: "blob",
  });

  // Create download link
  const blob = new Blob([data as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `submissions_${startDate}_${endDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export type { AdminStudentRow, AdminListResponse, SubmissionCell };

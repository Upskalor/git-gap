import { api } from "./client";
import type { DashboardResponse } from "@/types/api";

export const dashboardApi = {
  get: () => api.get<DashboardResponse>("/api/dashboard/").then((r) => r.data),

  recentActivity: (limit = 20) =>
    api.get<{ activities: Array<{ type: string; repository: string; status: string; created_at: string }> }>(
      "/api/dashboard/recent-activity",
      { params: { limit } },
    ).then((r) => r.data),
};

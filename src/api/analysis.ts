import { api } from "./client";
import type { Analysis } from "@/types/api";

export const analysisApi = {
  create: (repository_id: string, analysis_type = "deterministic") =>
    api.post<Analysis>("/api/analysis/", { repository_id, analysis_type }).then((r) => r.data),

  get: (id: string) => api.get<Analysis>(`/api/analysis/${id}`).then((r) => r.data),

  list: () => api.get<Analysis[]>("/api/analysis/").then((r) => r.data),

  mentorship: (analysis_id: string, question?: string) =>
    api.post<{ content: string; analysis_id: string; created_at: string }>(
      "/api/analysis/mentorship",
      { analysis_id, question },
    ).then((r) => r.data),
};

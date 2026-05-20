import { api } from "./client";
import type { Repository } from "@/types/api";

export const githubApi = {
  getAuthUrl: (state: string) =>
    api.get<{ authorization_url: string }>("/api/github/auth/url", { params: { state } })
      .then((r) => r.data),

  callback: (code: string, state: string) =>
    api.post<{ success: boolean; github_username: string }>("/api/github/auth/callback", null, {
      params: { code, state },
    }).then((r) => r.data),

  repositories: () => api.get<Repository[]>("/api/github/repositories").then((r) => r.data),
};

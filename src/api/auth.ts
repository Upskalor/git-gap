import { api } from "./client";
import type { TokenResponse, User } from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/api/auth/login", { email, password }).then((r) => r.data),

  register: (payload: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    goals?: string;
  }) => api.post<User>("/api/auth/register", payload).then((r) => r.data),

  me: () => api.get<User>("/api/auth/me").then((r) => r.data),

  updateProfile: (payload: Partial<Pick<User, "full_name" | "email" | "goals">>) =>
    api.put<User>("/api/auth/profile", payload).then((r) => r.data),
};

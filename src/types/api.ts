export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  goals?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Repository {
  id: string;
  github_id: string;
  name: string;
  full_name: string;
  description?: string | null;
  url: string;
  is_private: boolean;
  language?: string | null;
  stars: number;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string | null;
  code_snippet?: string | null;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: number;
  implementation_steps: string[];
  estimated_effort: string;
}

export interface Analysis {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  findings?: Finding[] | null;
  recommendations?: Recommendation[] | null;
  mentorship?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  repository?: Repository;
}

export interface DashboardStats {
  total_repositories: number;
  total_analyses: number;
  critical_issues: number;
  avg_analysis_time: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_analyses: Analysis[];
  top_issues: Finding[];
}

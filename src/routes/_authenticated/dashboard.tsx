import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  GitBranch,
  AlertTriangle,
  Activity,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { dashboardApi } from "@/api/dashboard";
import { Badge } from "@/components/common/Primitives";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const activityData = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  commits: Math.round(8 + Math.sin(i / 2) * 6 + Math.random() * 8),
}));
const languageData = [
  { name: "TypeScript", value: 42 },
  { name: "Python", value: 28 },
  { name: "Go", value: 14 },
  { name: "Rust", value: 9 },
  { name: "Other", value: 7 },
];
const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.get,
    retry: 1,
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Overview</p>
          <h1 className="font-display text-3xl font-bold">Your developer pulse</h1>
        </div>
        <Link
          to="/repositories"
          className="inline-flex items-center gap-2 rounded-full bg-grad-cta px-4 py-2 text-sm font-semibold text-white shadow-card hover:shadow-card-hover"
        >
          Analyze a repo <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      {isError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
          <p className="font-medium text-danger">Couldn't reach the backend.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure FastAPI is running and <code>VITE_API_BASE_URL</code> points at it.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Repositories"
          value={stats?.total_repositories ?? 0}
          delta="+2 this week"
          loading={isLoading}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Analyses"
          value={stats?.total_analyses ?? 0}
          delta="+5 this week"
          loading={isLoading}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Critical issues"
          value={stats?.critical_issues ?? 0}
          delta="−3 from last week"
          loading={isLoading}
          tone="warn"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg analysis time"
          value={stats ? `${stats.avg_analysis_time.toFixed(1)}s` : "—"}
          delta="background workers"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Commits — last 14 days" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
              <Area type="monotone" dataKey="commits" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Language mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={languageData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {languageData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Coding streak (weekly)" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityData.map((d, i) => ({ ...d, streak: 5 + (i % 7) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
              <Line type="monotone" dataKey="streak" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-2xl border border-border bg-grad-hero p-6 text-white shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5" /> AI mentor
          </div>
          <p className="mt-3 font-display text-lg leading-snug">
            You're shipping consistently. Next: write tests for your two most-starred repos.
          </p>
          <Link
            to="/mentor"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-card"
          >
            Open mentor <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent analyses</h3>
          <Link to="/repositories" className="text-xs font-medium text-brand-blue hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-3 h-12 w-full" />)
          ) : data?.recent_analyses?.length ? (
            data.recent_analyses.slice(0, 6).map((a) => (
              <Link
                to="/analysis/$id"
                params={{ id: a.id }}
                key={a.id}
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-surface/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.repository?.full_name || "Repository"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  tone={a.status === "completed" ? "success" : a.status === "failed" ? "danger" : "warn"}
                >
                  {a.status}
                </Badge>
              </Link>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  loading,
  tone = "info",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  delta: string;
  loading?: boolean;
  tone?: "info" | "warn";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-brand-blue">
          {icon}
        </span>
        <Badge tone={tone === "warn" ? "warn" : "success"}>
          <TrendingUp className="h-3 w-3" /> {delta}
        </Badge>
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 font-display text-3xl font-bold">
        {loading ? <Skeleton className="h-9 w-20" /> : value}
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-card ${className ?? ""}`}>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted-foreground">No analyses yet.</p>
      <Link
        to="/repositories"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-grad-cta px-4 py-2 text-xs font-semibold text-white shadow-card"
      >
        Run your first analysis
      </Link>
    </div>
  );
}

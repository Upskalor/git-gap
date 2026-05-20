import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileDown,
  Sparkles,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { analysisApi } from "@/api/analysis";
import { Badge } from "@/components/common/Primitives";
import type { Finding } from "@/types/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  component: AnalysisPage,
});

const severityTone: Record<Finding["severity"], "danger" | "warn" | "info" | "success"> = {
  critical: "danger",
  high: "danger",
  medium: "warn",
  low: "info",
};

function AnalysisPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => analysisApi.get(id),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && s !== "pending" && s !== "running" ? false : 2500;
    },
  });

  const isRunning = !data || data.status === "pending" || data.status === "running";

  const scoreData = [
    { axis: "Code quality", v: 78 },
    { axis: "Tests", v: 52 },
    { axis: "Docs", v: 64 },
    { axis: "Architecture", v: 71 },
    { axis: "Commits", v: 88 },
    { axis: "Issues", v: 60 },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/repositories"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to repositories
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Analysis</p>
          <h1 className="font-display text-3xl font-bold">
            {data?.repository?.full_name || "Repository analysis"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            tone={
              data?.status === "completed"
                ? "success"
                : data?.status === "failed"
                  ? "danger"
                  : "warn"
            }
          >
            {data?.status ?? "loading"}
          </Badge>
          <button
            onClick={() => toast.info("Export coming soon")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-surface-hover"
          >
            <FileDown className="h-4 w-4" /> Export
          </button>
        </div>
      </header>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-2xl border border-border bg-grad-hero p-8 text-white shadow-card"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="font-display text-lg font-semibold">
              {isLoading ? "Loading analysis…" : "Running analysis in background…"}
            </p>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-1/3 shimmer rounded-full bg-white/40" />
          </div>
          <p className="mt-3 text-sm text-white/80">
            Scanning structure · Inspecting commits · Generating mentorship
          </p>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card xl:col-span-2">
          <h3 className="font-display text-lg font-semibold">Quality breakdown</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={scoreData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} angle={45} />
              <Radar
                name="Score"
                dataKey="v"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Overall</h3>
          <div className="mt-6 grid place-items-center">
            <div className="relative grid h-40 w-40 place-items-center rounded-full bg-grad-card shadow-glow">
              <div className="grid h-32 w-32 place-items-center rounded-full bg-card text-center">
                <div>
                  <div className="font-mono text-4xl font-bold text-grad">
                    {data?.status === "completed" ? "74" : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">AI Score</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Composite of code quality, tests, docs, and architecture.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Findings</h3>
            <Badge tone="info">{data?.findings?.length ?? 0}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.findings ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {isRunning ? "Findings will appear here as the analysis runs." : "No findings — nice work."}
              </p>
            ) : (
              data!.findings!.map((f, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface/60 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-semibold">{f.category}</span>
                    <Badge tone={severityTone[f.severity]}>{f.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                  {f.location && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{f.location}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recommendations</h3>
            <Badge tone="success">{data?.recommendations?.length ?? 0}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.recommendations ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {isRunning ? "Recommendations build after findings complete." : "No recommendations."}
              </p>
            ) : (
              data!.recommendations!.map((r, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface/60 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold">{r.title}</span>
                    <Badge tone="info">P{r.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  {r.implementation_steps?.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {r.implementation_steps.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Effort: <span className="text-foreground">{r.estimated_effort}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {data?.mentorship && (
        <div className="rounded-2xl border border-border bg-grad-hero p-6 text-white shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5" /> Mentor summary
          </div>
          <p className="mt-3 whitespace-pre-line font-display text-lg leading-snug">
            {data.mentorship}
          </p>
        </div>
      )}
    </div>
  );
}

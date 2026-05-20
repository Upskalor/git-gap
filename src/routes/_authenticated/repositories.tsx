import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Star, Loader2, Lock, Globe, Search, Sparkles, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { githubApi } from "@/api/github";
import { analysisApi } from "@/api/analysis";
import { extractError } from "@/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/common/Primitives";

export const Route = createFileRoute("/_authenticated/repositories")({
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["repositories"],
    queryFn: githubApi.repositories,
    retry: 1,
  });

  const analyze = useMutation({
    mutationFn: (id: string) => analysisApi.create(id),
    onMutate: (id) => setAnalyzingId(id),
    onSuccess: (analysis) => {
      toast.success("Analysis started");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/analysis/$id", params: { id: analysis.id } });
    },
    onError: (e) => toast.error(extractError(e, "Couldn't start analysis")),
    onSettled: () => setAnalyzingId(null),
  });

  const repos = (data ?? []).filter(
    (r) =>
      !q ||
      r.full_name.toLowerCase().includes(q.toLowerCase()) ||
      r.description?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Repositories</p>
          <h1 className="font-display text-3xl font-bold">Pick one to analyze</h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-surface-hover"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search repositories…"
          className="w-full rounded-full border border-input bg-card py-2.5 pl-9 pr-4 text-sm outline-none ring-ring/40 focus:ring-2"
        />
      </div>

      {isError && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">GitHub not connected?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your GitHub account from Settings → Integrations to import repositories.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <GitBranch className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-lg font-semibold">No repositories yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect GitHub to import your repos. We'll keep them in sync automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repos.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between">
                <h3 className="truncate font-display font-semibold">{r.name}</h3>
                {r.is_private ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{r.full_name}</p>
              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {r.description || "No description"}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                {r.language && <Badge tone="info">{r.language}</Badge>}
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3" /> {r.stars}
                </span>
              </div>
              <button
                onClick={() => analyze.mutate(r.id)}
                disabled={analyzingId === r.id}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-grad-cta px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
              >
                {analyzingId === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Analyze
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

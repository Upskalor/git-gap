import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, Target, BookOpen, Trophy } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/api/dashboard";
import { analysisApi } from "@/api/analysis";
import { extractError } from "@/api/client";

export const Route = createFileRoute("/_authenticated/mentor")({
  component: MentorPage,
});

interface Message {
  role: "user" | "ai";
  content: string;
  ts: number;
}

const seed: Message[] = [
  {
    role: "ai",
    content:
      "Welcome. I'm your mentor — I read your real activity, not your resume. Ask me anything about your growth.",
    ts: Date.now(),
  },
];

function MentorPage() {
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get, retry: 0 });
  const latestAnalysisId = dash?.recent_analyses?.[0]?.id;

  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");

  const ask = useMutation({
    mutationFn: async (question: string) => {
      if (!latestAnalysisId) throw new Error("Run an analysis first so the mentor has context.");
      return analysisApi.mentorship(latestAnalysisId, question);
    },
    onSuccess: (r) => setMessages((m) => [...m, { role: "ai", content: r.content, ts: Date.now() }]),
    onError: (e) => {
      const msg = extractError(e, "Mentor unavailable");
      toast.error(msg);
      setMessages((m) => [...m, { role: "ai", content: `⚠️ ${msg}`, ts: Date.now() }]);
    },
  });

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", content: input, ts: Date.now() }]);
    ask.mutate(input);
    setInput("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <aside className="space-y-4 xl:col-span-1">
        <div className="rounded-2xl border border-border bg-grad-hero p-6 text-white shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5" /> AI Mentor
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">Personalized for you</h1>
          <p className="mt-2 text-sm text-white/80">
            Recommendations are grounded in your latest repository analysis.
          </p>
        </div>

        <RoadmapCard
          icon={<Target className="h-4 w-4" />}
          title="This week"
          items={["Refactor your most-starred repo's tests", "Open 2 issues with clear repros", "Ship one small ML script"]}
        />
        <RoadmapCard
          icon={<BookOpen className="h-4 w-4" />}
          title="Skill gaps"
          items={["Backend: caching strategies", "Testing: integration coverage", "Docs: README structure"]}
        />
        <RoadmapCard
          icon={<Trophy className="h-4 w-4" />}
          title="Suggested projects"
          items={["RAG over your own docs", "Tiny FastAPI rate-limiter", "Open-source PR to a tool you use"]}
        />
      </aside>

      <section className="flex h-[78vh] flex-col rounded-2xl border border-border bg-card shadow-card xl:col-span-2">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Mentor chat</h2>
            <p className="text-xs text-muted-foreground">
              {latestAnalysisId ? "Grounded in your latest analysis" : "Run an analysis to ground the mentor"}
            </p>
          </div>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={m.ts + "-" + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card ${
                    m.role === "user"
                      ? "bg-grad-cta text-white"
                      : "border border-border bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {ask.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Mentor is thinking…
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask: 'Where am I drifting from my goal?'"
            className="flex-1 rounded-full border border-input bg-card px-4 py-2.5 text-sm outline-none ring-ring/40 focus:ring-2"
          />
          <button
            disabled={ask.isPending || !input.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-grad-cta px-4 py-2.5 text-sm font-semibold text-white shadow-card disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function RoadmapCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-grad-cta text-white">{icon}</span>
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-purple" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

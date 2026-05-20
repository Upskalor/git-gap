import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Github,
  Sparkles,
  Brain,
  Activity,
  GitBranch,
  ShieldCheck,
  LineChart,
  Zap,
  Code2,
  Star,
} from "lucide-react";
import { MarketingNav, Footer } from "@/components/layout/MarketingNav";
import { GradientOrbs, Section, GlassCard, Badge } from "@/components/common/Primitives";

export const Route = createFileRoute("/")({ component: Landing });

const features = [
  {
    icon: Brain,
    title: "AI mentorship",
    body: "Personalized growth roadmaps based on your real commits, not your resume.",
  },
  {
    icon: ShieldCheck,
    title: "Code quality score",
    body: "Deterministic + LLM analysis grades structure, tests, docs, and reliability.",
  },
  {
    icon: Activity,
    title: "Activity intelligence",
    body: "See streaks, focus drift, and language mix across all your repositories.",
  },
  {
    icon: GitBranch,
    title: "Repo deep-scans",
    body: "Connect any public or private repo and get findings in under a minute.",
  },
  {
    icon: LineChart,
    title: "Skill progress",
    body: "Track measurable improvement against your declared learning goals.",
  },
  {
    icon: Zap,
    title: "Fast, async pipeline",
    body: "Background workers run analyses while you keep coding.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <MarketingNav />

      {/* HERO */}
      <div className="relative">
        <GradientOrbs />
        <div className="relative mx-auto w-[min(1180px,92%)] pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-purple" />
            AI-powered GitHub mentorship
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold tracking-tight md:text-6xl"
          >
            Your GitHub tells the <span className="text-grad">truth</span> about your career.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg"
          >
            GitGap analyzes every repository, surfaces what's holding you back, and gives you a
            personalized AI mentor that grows with your goals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-grad-cta px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-hover"
            >
              <Github className="h-4 w-4" /> Sign in
            </Link>
          </motion.div>

          {/* Floating preview cards */}
          <div className="relative mx-auto mt-16 grid w-full gap-5 md:grid-cols-3">
            <GlassCard delay={0.05}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Alignment</p>
              <p className="mt-1 font-display text-lg font-semibold">AI/ML Engineer</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="font-mono text-3xl font-semibold text-grad">58</div>
                <Badge tone="warn">drift detected</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Mostly frontend activity this month</p>
            </GlassCard>
            <GlassCard delay={0.12} className="md:-translate-y-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">Last 16 weeks</p>
                <Badge tone="success">+12%</Badge>
              </div>
              <div className="mt-4 grid grid-cols-7 items-end gap-1.5">
                {[18, 32, 24, 48, 36, 64, 52, 80, 42, 60, 70, 56, 88, 72, 96, 84].map((v, i) => (
                  <div
                    key={i}
                    style={{ height: `${v}%` }}
                    className="rounded-sm bg-grad-cta opacity-90"
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Commits / week</p>
            </GlassCard>
            <GlassCard delay={0.2}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">AI mentor</p>
              <p className="mt-1 font-display text-sm">
                "Ship a small ML project this week. Your TypeScript is strong — pair it with a
                FastAPI service and deploy."
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Personalized · 2m ago</span>
                <Badge tone="info">action plan</Badge>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <Section id="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built for developers who want to <span className="text-grad">level up</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            One platform for repository quality, productivity, and personalized growth.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <GlassCard key={f.title} delay={i * 0.05}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-grad-cta text-white shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-12">
        <div className="grid gap-8 rounded-3xl border border-border bg-grad-subtle p-10 md:grid-cols-3">
          {[
            { n: "01", t: "Connect GitHub", d: "OAuth in one click. Your repos sync automatically." },
            { n: "02", t: "Run an analysis", d: "Pick a repo. Background workers do the heavy lifting." },
            { n: "03", t: "Get mentored", d: "Findings, recommendations, and a personalized roadmap." },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-mono text-sm text-brand-purple">{s.n}</div>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* STATS */}
      <Section className="py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "12k+", v: "repositories analyzed" },
            { k: "94%", v: "users improve in 30d" },
            { k: "<60s", v: "average analysis time" },
            { k: "4.9/5", v: "developer rating" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <div className="font-display text-3xl font-bold text-grad">{s.k}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section id="pricing">
        <div className="relative overflow-hidden rounded-3xl bg-grad-hero p-12 text-center text-white shadow-hero">
          <div className="orb h-96 w-96 right-0 top-0 bg-brand-purple-light/40" />
          <h2 className="relative font-display text-3xl font-bold md:text-4xl">
            Free while you're learning. Always.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Get unlimited public repository analyses and weekly AI mentorship. Upgrade only when
            your team grows.
          </p>
          <Link
            to="/signup"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-card hover:shadow-card-hover"
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="relative mt-6 flex items-center justify-center gap-2 text-xs text-white/70">
            <Star className="h-3.5 w-3.5" /> No credit card · OAuth in one click
          </div>
        </div>
      </Section>

      {/* TESTIMONIAL */}
      <Section className="py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              q: "GitGap caught the exact gap between what I claimed and what I was building. Brutal but fair.",
              a: "Maya R., backend engineer",
            },
            {
              q: "The mentor recommendations actually feel like a senior dev pairing with me weekly.",
              a: "Daniel O., ML student",
            },
          ].map((t, i) => (
            <GlassCard key={i} delay={i * 0.05}>
              <Code2 className="h-5 w-5 text-brand-purple" />
              <p className="mt-3 font-display text-lg leading-relaxed">"{t.q}"</p>
              <p className="mt-3 text-xs text-muted-foreground">— {t.a}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Footer />
    </div>
  );
}

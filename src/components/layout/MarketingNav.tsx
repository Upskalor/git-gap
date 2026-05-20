import { Link, useRouterState } from "@tanstack/react-router";
import { Github, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export function MarketingNav() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated());
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-4 flex w-[min(1180px,94%)] items-center justify-between rounded-full border border-border bg-card/70 px-5 py-2.5 shadow-card backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-grad-cta text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">GitGap</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-grad-cta px-4 py-2 text-sm font-semibold text-white shadow-card hover:shadow-card-hover"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-grad-cta px-4 py-2 text-sm font-semibold text-white shadow-card hover:shadow-card-hover"
              >
                <Github className="h-4 w-4" /> Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/40 py-10">
      <div className="mx-auto flex w-[min(1180px,92%)] flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} GitGap. Crafted for developers.</p>
        <div className="flex gap-5">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Status</a>
        </div>
      </div>
    </footer>
  );
}

export function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GradientOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="orb h-[420px] w-[420px] -left-20 -top-24 bg-brand-blue/40" />
      <div className="orb h-[520px] w-[520px] right-[-100px] top-40 bg-brand-purple/40" />
      <div className="orb h-[360px] w-[360px] left-1/3 bottom-[-120px] bg-brand-cyan/30" />
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto w-[min(1180px,92%)] py-20", className)}>
      {children}
    </section>
  );
}

export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      className={cn(
        "rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur transition hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warn" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warn: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    info: "bg-brand-blue/15 text-brand-blue",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

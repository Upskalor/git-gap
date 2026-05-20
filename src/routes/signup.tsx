import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { extractError } from "@/api/client";
import { GradientOrbs } from "@/components/common/Primitives";

const schema = z.object({
  full_name: z.string().min(2, "Tell us your name").max(80),
  username: z.string().min(3, "At least 3 characters").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ or -"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  goals: z.string().max(280).optional(),
  terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({ component: SignupPage });

function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function SignupPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
      goals: "",
      terms: false as unknown as true,
    },
  });

  const password = form.watch("password");
  const s = strength(password ?? "");

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      await authApi.register({
        email: v.email,
        username: v.username,
        password: v.password,
        full_name: v.full_name,
        goals: v.goals || undefined,
      });
      const tokens = await authApi.login(v.email, v.password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me);
    },
    onSuccess: () => {
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(extractError(e, "Signup failed")),
  });

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/login" className="font-medium text-brand-blue hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" {...form.register("full_name")} error={form.formState.errors.full_name?.message} />
              <Input label="Username" {...form.register("username")} error={form.formState.errors.username?.message} />
            </div>
            <Input label="Email" type="email" {...form.register("email")} error={form.formState.errors.email?.message} />
            <Input
              label="Password"
              type="password"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
            />
            {password && (
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < s
                        ? s <= 1
                          ? "bg-danger"
                          : s === 2
                            ? "bg-warning"
                            : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Learning goal (optional)</span>
              <textarea
                {...form.register("goals")}
                rows={2}
                placeholder="e.g. Become an AI/ML engineer in 6 months"
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-sm outline-none ring-ring/40 transition focus:ring-2"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...form.register("terms")} className="mt-0.5 h-4 w-4 rounded border-border" />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>
            {form.formState.errors.terms && (
              <span className="block text-xs text-danger">{form.formState.errors.terms.message}</span>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-grad-cta px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-grad-hero p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <GradientOrbs />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">GitGap</span>
        </Link>
        <div className="relative space-y-4">
          <h2 className="font-display text-4xl font-bold">Start with the truth.</h2>
          <ul className="space-y-2 text-white/85">
            {[
              "Connect GitHub in one click",
              "Get your first analysis in under a minute",
              "Personal mentor tuned to your goals",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} GitGap</p>
      </div>
    </div>
  );
}

function Input({
  label,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...rest}
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-sm outline-none ring-ring/40 transition focus:ring-2"
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Github, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { extractError } from "@/api/client";
import { GradientOrbs } from "@/components/common/Primitives";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/dashboard",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const tokens = await authApi.login(v.email, v.password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    onSuccess: () => {
      toast.success("Welcome back");
      navigate({ to: search.redirect });
    },
    onError: (e) => toast.error(extractError(e, "Login failed")),
  });

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-grad-hero p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <GradientOrbs />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">GitGap</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold">Welcome back.</h2>
          <p className="mt-3 max-w-md text-white/80">
            Your AI mentor has been watching your commits. Let's see what changed.
          </p>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} GitGap</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-3xl font-bold">Log in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-brand-blue hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-8 space-y-4">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              error={form.formState.errors.email?.message}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" {...form.register("remember")} className="h-4 w-4 rounded border-border" />
                Remember me
              </label>
              <a href="#" className="text-brand-blue hover:underline">Forgot password?</a>
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-grad-cta px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={() => toast.info("Connect GitHub from the dashboard after login")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-hover"
          >
            <Github className="h-4 w-4" /> Continue with GitHub
          </button>
        </motion.div>
      </div>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
const Field = (() => {
  // eslint-disable-next-line react/display-name
  return Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      const { label, error, ...rest } = props as FieldProps;
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
    },
    {},
  );
})();

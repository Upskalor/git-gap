import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const state = useAuthStore.getState();
    if (!state.accessToken) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppShell,
});

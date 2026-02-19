import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import superjson from "superjson";
import AppShell from "./AppShell";
import { getLoginUrl } from "./const";
import "./index.css";

console.log("[nexrel] imports done");
const el0 = document.getElementById("loading-fallback");
if (el0) el0.textContent = "Loading... (1)";
console.log("[nexrel] step 1");
const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message !== UNAUTHED_ERR_MSG) return;
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

if (el0) el0.textContent = "Loading... (2)";
console.log("[nexrel] step 2");
const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

try {
  console.log("[nexrel] step 2b - about to render App");
  flushSync(() => {
    createRoot(root).render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </trpc.Provider>
    );
  });
  console.log("[nexrel] step 3 - render complete");
} catch (err) {
  console.error("[nexrel] render error", err);
  if (el0) el0.innerHTML = `<p style="color:red">Render error: ${(err as Error).message}</p>`;
}

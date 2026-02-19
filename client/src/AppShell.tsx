/**
 * App shell - wraps Router with providers.
 */
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgencyConfigProvider } from "./contexts/AgencyConfigContext";
import { PageContextProvider } from "./contexts/PageContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router } from "./App";

function AppShell() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AgencyConfigProvider>
          <PageContextProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </PageContextProvider>
        </AgencyConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppShell;

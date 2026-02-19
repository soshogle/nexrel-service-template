/**
 * Provides agency config from CRM (when NEXREL_WEBSITE_ID set) or template defaults.
 * Owner-agnostic: template uses placeholders; each deployment gets owner config from CRM.
 */
import { createContext, useContext, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { DEFAULT_AGENCY_CONFIG, type AgencyConfig } from "@/lib/agency-config";

const AgencyConfigContext = createContext<AgencyConfig>(DEFAULT_AGENCY_CONFIG);

export function AgencyConfigProvider({ children }: { children: React.ReactNode }) {
  const { data: crmConfig } = trpc.agencyConfig.get.useQuery(undefined, {
    staleTime: 30 * 1000, // 30 sec — changes appear within 30s; Publish in CRM shows countdown
  });

  const config = useMemo((): AgencyConfig => {
    if (crmConfig) {
      const nav = crmConfig.navConfig;
      const labels = crmConfig.pageLabels;
      return {
        ...DEFAULT_AGENCY_CONFIG,
        ...crmConfig,
        languages: (crmConfig.languages || DEFAULT_AGENCY_CONFIG.languages) as readonly [string, ...string[]],
        navConfig: nav && Object.keys(nav).length > 0
          ? { ...DEFAULT_AGENCY_CONFIG.navConfig, ...nav }
          : DEFAULT_AGENCY_CONFIG.navConfig,
        pageLabels: labels && Object.keys(labels).length > 0
          ? { ...DEFAULT_AGENCY_CONFIG.pageLabels, ...labels }
          : DEFAULT_AGENCY_CONFIG.pageLabels,
      };
    }
    return DEFAULT_AGENCY_CONFIG;
  }, [crmConfig]);

  return (
    <AgencyConfigContext.Provider value={config}>
      {children}
    </AgencyConfigContext.Provider>
  );
}

export function useAgencyConfig(): AgencyConfig {
  const ctx = useContext(AgencyConfigContext);
  if (!ctx) {
    return DEFAULT_AGENCY_CONFIG;
  }
  return ctx;
}

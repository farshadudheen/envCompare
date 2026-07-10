import { managementApiSecurity } from "./management-api.js";
import { umbHttpClient } from "@umbraco-cms/backoffice/http-client";

export type EnvironmentInfo = {
  name: string;
  displayName: string;
  baseUrl?: string | null;
  isLocal: boolean;
  isAvailable: boolean;
};

/**
 * Loads configured environments from the EnvCompare management API.
 */
export async function fetchEnvironments(): Promise<EnvironmentInfo[]> {
  const { data, error, response } = await umbHttpClient.get({
    url: "/umbraco/management/api/v1/envcompare/environments",
    security: managementApiSecurity,
  });

  if (error || !response.ok) {
    throw new Error(
      `Failed to load environments (${response?.status ?? "unknown"}).`,
    );
  }

  const payload = data as EnvironmentInfo[] | undefined;
  return Array.isArray(payload) ? payload : [];
}

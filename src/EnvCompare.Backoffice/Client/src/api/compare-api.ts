import { client } from "./client.gen.js";

export type DifferenceType =
  | "Identical"
  | "Added"
  | "Missing"
  | "Modified"
  | "Ignored"
  | number;

export type ComparisonItem = {
  id: string;
  name: string;
  contentType?: string | null;
  path?: string | null;
  culture?: string | null;
  segment?: string | null;
  status: DifferenceType;
  environmentAValue?: string | null;
  environmentBValue?: string | null;
  differenceSummary?: string | null;
  moduleAlias?: string | null;
};

export type ComparisonResult = {
  items: ComparisonItem[];
  totalCompared: number;
  identicalCount: number;
  addedCount: number;
  missingCount: number;
  modifiedCount: number;
  ignoredCount: number;
};

export type CompareRequest = {
  environmentA: string;
  environmentB: string;
  modules?: string[];
  culture?: string;
  contentType?: string;
  pathContains?: string;
  status?: string;
  search?: string;
};

/**
 * Runs a comparison between two environments.
 */
export async function runComparison(
  request: CompareRequest,
): Promise<ComparisonResult> {
  const { data, error, response } = await client.post({
    url: "/umbraco/envcompare/api/v1/compare",
    body: request,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error || !response.ok) {
    const message =
      typeof error === "string"
        ? error
        : `Comparison failed (${response?.status ?? "unknown"}).`;
    throw new Error(message);
  }

  return data as ComparisonResult;
}

export function statusLabel(status: DifferenceType): string {
  if (typeof status === "number") {
    return (
      ["Identical", "Added", "Missing", "Modified", "Ignored"][status] ??
      String(status)
    );
  }
  return status;
}

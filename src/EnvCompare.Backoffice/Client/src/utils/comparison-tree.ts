import type { ComparisonItem } from "../api/compare-api.js";
import { statusLabel } from "../api/compare-api.js";

export type TreeNode = {
  id: string;
  label: string;
  path: string;
  depth: number;
  item: ComparisonItem | null;
  children: TreeNode[];
  statusRank: number;
};

const STATUS_RANK: Record<string, number> = {
  Missing: 4,
  Modified: 3,
  Added: 2,
  Identical: 1,
  Ignored: 0,
};

/**
 * Builds a hierarchy from flat comparison rows using Umbraco path strings.
 */
export function buildComparisonTree(items: ComparisonItem[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  const sorted = [...items].sort((a, b) => {
    const pathA = a.path ?? a.id;
    const pathB = b.path ?? b.id;
    return pathA.localeCompare(pathB);
  });

  for (const item of sorted) {
    const path = item.path?.trim() || item.id;
    const segments = path.split(",").filter((s) => s.length > 0);
    const depth = Math.max(segments.length, 1);
    const rowKey = `${item.id}|${item.culture ?? ""}|${item.segment ?? ""}`;

    let currentPath = "";
    for (let i = 0; i < depth; i++) {
      const segment = segments[i] ?? item.id;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath},${segment}` : segment;

      if (!nodes.has(currentPath)) {
        const isLeaf = i === depth - 1;
        const node: TreeNode = {
          id: isLeaf ? item.id : currentPath,
          label: isLeaf ? item.name : `… ${segment}`,
          path: currentPath,
          depth: i,
          item: isLeaf ? item : null,
          children: [],
          statusRank: isLeaf ? rankStatus(item) : 0,
        };
        nodes.set(currentPath, node);

        if (parentPath) {
          nodes.get(parentPath)?.children.push(node);
        } else {
          roots.push(node);
        }
      } else if (i === depth - 1) {
        const existing = nodes.get(currentPath)!;
        const existingRowKey = existing.item
          ? `${existing.item.id}|${existing.item.culture ?? ""}|${existing.item.segment ?? ""}`
          : null;

        if (existingRowKey === null || existingRowKey === rowKey) {
          // A folder placeholder created earlier is now backed by its real item.
          existing.item = item;
          existing.label = item.name;
          existing.id = item.id;
          existing.statusRank = Math.max(existing.statusRank, rankStatus(item));
        } else {
          // Distinct items can share a path (e.g. settings items keyed by editor
          // alias, or the same node compared per culture): add a sibling node
          // instead of overwriting, so no row is lost in the tree view.
          const uniquePath = `${currentPath}::${rowKey}`;
          if (!nodes.has(uniquePath)) {
            const node: TreeNode = {
              id: item.id,
              label: item.name,
              path: uniquePath,
              depth: i,
              item,
              children: [],
              statusRank: rankStatus(item),
            };
            nodes.set(uniquePath, node);

            if (parentPath) {
              nodes.get(parentPath)?.children.push(node);
            } else {
              roots.push(node);
            }
          }
        }
      }
    }
  }

  propagateStatus(roots);
  return roots;
}

/**
 * Flattens visible tree nodes respecting expanded state.
 */
export function flattenTree(
  nodes: TreeNode[],
  expanded: ReadonlySet<string>,
  depth = 0,
): Array<{ node: TreeNode; depth: number }> {
  const flat: Array<{ node: TreeNode; depth: number }> = [];

  for (const node of nodes) {
    flat.push({ node, depth });
    if (node.children.length > 0 && expanded.has(node.path)) {
      flat.push(...flattenTree(node.children, expanded, depth + 1));
    }
  }

  return flat;
}

/**
 * Collects distinct filter option values from a result set.
 */
export function collectFilterOptions(items: ComparisonItem[]) {
  const cultures = new Set<string>();
  const contentTypes = new Set<string>();

  for (const item of items) {
    if (item.culture) {
      cultures.add(item.culture);
    }
    if (item.contentType) {
      contentTypes.add(item.contentType);
    }
  }

  return {
    cultures: [...cultures].sort(),
    contentTypes: [...contentTypes].sort(),
  };
}

function rankStatus(item: ComparisonItem): number {
  return STATUS_RANK[statusLabel(item.status)] ?? 0;
}

function propagateStatus(nodes: TreeNode[]) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      propagateStatus(node.children);
      node.statusRank = Math.max(
        node.statusRank,
        ...node.children.map((c) => c.statusRank),
      );
    }
  }
}

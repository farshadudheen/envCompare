/**
 * Helpers for windowed rendering of long lists.
 */

export type VirtualScrollRange = {
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
};

/**
 * Computes which item indices are visible for a fixed row height scroller.
 */
export function getVirtualScrollRange(
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
  rowHeight: number,
  overscan = 4,
): VirtualScrollRange {
  if (itemCount <= 0 || rowHeight <= 0) {
    return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };
  }

  const totalHeight = itemCount * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const end = Math.min(itemCount, start + visibleCount);

  return {
    start,
    end,
    offsetTop: start * rowHeight,
    totalHeight,
  };
}

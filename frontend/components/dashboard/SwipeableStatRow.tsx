"use client";
import { useUi } from "@/components/common/UiText";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SwipeableStatRowProps {
  items: { key: string; node: ReactNode }[];
  className?: string;
}

/**
 * A horizontally scroll-snapping row below `sm`, a normal grid from `sm` up —
 * the first swipeable surface in this codebase (every other list/grid so far
 * has just stacked vertically on mobile). StatCards are dense enough that
 * stacking six of them vertically pushes everything else below the fold on a
 * phone; swiping keeps "glance at the number you care about" a horizontal
 * gesture instead of a long scroll. Native scroll, no library — full
 * touch scrolling plus an explicitly focusable, labeled keyboard region.
 */
export function SwipeableStatRow({ items, className }: SwipeableStatRowProps) {
  const ui = useUi();
  return (
    <div
      role="region"
      aria-label={ui("Analytics statistics")}
      tabIndex={0}
      className={cn(
        "focus-visible:ring-ring/50 flex snap-x snap-mandatory gap-3 overflow-x-auto rounded pb-1 outline-none focus-visible:ring-3",
        "sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0",
        "lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="w-[80%] shrink-0 snap-start sm:w-auto sm:shrink"
        >
          {item.node}
        </div>
      ))}
    </div>
  );
}

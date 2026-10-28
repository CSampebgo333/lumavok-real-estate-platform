"use client";
import { useUi } from "@/components/common/UiText";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SwipeableStatRowProps {
  items: { key: string; node: ReactNode }[];
  className?: string;
}

function scrollWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  const row = event.currentTarget;
  if (
    event.target !== row ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    row.scrollWidth <= row.clientWidth ||
    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  )
    return;

  event.preventDefault();
  const max = row.scrollWidth - row.clientWidth;
  const children = Array.from(row.children) as HTMLElement[];
  const start = children[0]?.offsetLeft ?? 0;
  const stops = children.map((child) =>
    Math.min(max, child.offsetLeft - start),
  );
  const left =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? max
        : event.key === "ArrowRight"
          ? (stops.find((stop) => stop > row.scrollLeft + 1) ?? max)
          : (stops.findLast((stop) => stop < row.scrollLeft - 1) ?? 0);
  // Small native arrow scrolls can snap back to the same card. Move to the
  // next card directly, without motion or intercepting a child's controls.
  row.scrollTo({ left, behavior: "instant" });
}

/**
 * A horizontally scroll-snapping row below `sm`, a normal grid from `sm` up —
 * the first swipeable surface in this codebase (every other list/grid so far
 * has just stacked vertically on mobile). StatCards are dense enough that
 * stacking six of them vertically pushes everything else below the fold on a
 * phone; swiping keeps "glance at the number you care about" a horizontal
 * gesture instead of a long scroll. Native scroll, no library — full
 * touch scrolling plus a labeled keyboard region with card-sized steps.
 */
export function SwipeableStatRow({ items, className }: SwipeableStatRowProps) {
  const ui = useUi();
  return (
    <div
      role="region"
      aria-label={ui("Analytics statistics")}
      tabIndex={0}
      onKeyDown={scrollWithKeyboard}
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

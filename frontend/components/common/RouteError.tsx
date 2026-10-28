"use client";
import { UiText, useUi } from "@/components/common/UiText";


import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  /**
   * Next's `unstable_retry` — re-fetches and re-renders the failed segment.
   * Preferred over `reset()`, which only clears the error state without
   * re-requesting anything: almost every error this boundary will see once the
   * backend is live is a failed fetch, and re-rendering the same failure is not
   * a recovery.
   */
  retry: () => void;
  /** Where "back to safety" should lead for this route group. */
  homeHref: string;
  homeLabel: string;
  description?: string;
}

/**
 * The one implementation behind every route-level `error.tsx`.
 *
 * Each boundary file stays a thin wrapper so the recovery UI, the logging hook
 * and the "what we show the user" policy live in a single place — this
 * deliberately does not introduce a second error-handling architecture
 * alongside components/common/ErrorBoundary.tsx, which remains the client-side
 * render-error net inside the app shell. Next's boundaries cover what that
 * class component cannot: errors thrown in Server Components and during data
 * fetching, isolated to the segment that failed.
 */
export function RouteError({
  error,
  retry,
  homeHref,
  homeLabel,
  description = "This section could not be loaded. You can try again, or head back and continue.",
}: RouteErrorProps) {
  const ui = useUi();
  useEffect(() => {
    // Console only. There is no error-reporting service wired up, and inventing
    // one here would be fabricating infrastructure that does not exist.
    console.error("Route failed", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <ErrorState
      title={ui("Something went wrong.")}
      description={description}
      action={
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" size="lg" onClick={retry}><UiText text={"Try again"} />{" "}</Button>
          <Link
            href={homeHref}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <UiText text={homeLabel} />
          </Link>
          {/*
            `digest` is the opaque identifier Next generates so a user-facing
            error can be matched to a server log line. It carries no stack, no
            message and no internal detail — that is precisely why Next exposes
            it — so surfacing it helps support without leaking anything. Shown
            only when one exists (client-side errors have none).
          */}
          {error.digest && (
            <p className="text-muted-foreground w-full text-xs"><UiText text={"Reference:"} />{" "}<span className="font-mono">{error.digest}</span>
            </p>
          )}
        </div>
      }
    />
  );
}

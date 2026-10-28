"use client";
import { UiText, useUi } from "@/components/common/UiText";

import { useAuthStore } from "@/store/authStore";
import { Heart, Info } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { AnimatedNumber } from "@/components/motion";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useSavedProperties } from "@/hooks/useProperties";

/** Saved properties are synchronized with the signed-in account. */
export function SavedPropertiesView() {
  const ui = useUi();
  const { properties, savedCount, isLoading, isError, error } =
    useSavedProperties();

  const authenticated = useAuthStore((state) => state.isAuthenticated);
  if (!authenticated)
    return (
      <EmptyState
        title={ui("Sign in to see saved properties")}
        description={ui("Your shortlist is securely saved to your account.")}
        action={
          <Link href="/login?redirect=%2Fsaved" className={buttonVariants()}>
            <UiText text={"Sign in"} />
          </Link>
        }
      />
    );

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow={ui("Your shortlist")}
        title={ui("Saved Properties")}
        meta={
          <p
            className="text-muted-foreground text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading ? (
              ui("Loading your saved properties")
            ) : (
              <>
                <AnimatedNumber value={savedCount} />
                {savedCount === 1 ? " property saved" : " properties saved"}
              </>
            )}
          </p>
        }
      />

      <div className="container-page page-section flex flex-col gap-6">
        {savedCount > 0 && (
          <p className="text-muted-foreground border-border flex items-start gap-2 border-l-2 py-1 pl-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <UiText
                text={
                  "Saved properties are synced to your account across devices."
                }
              />{" "}
            </span>
          </p>
        )}

        {!isLoading && !isError && savedCount === 0 ? (
          <EmptyState
            title={ui("Nothing saved yet")}
            description={ui(
              "Use the heart on any listing to keep it here while you compare.",
            )}
            action={
              <Link
                href={ROUTES.PROPERTIES}
                className={buttonVariants({ className: "mt-2 gap-2" })}
              >
                <Heart className="size-4" aria-hidden />
                <UiText text={"Browse properties"} />{" "}
              </Link>
            }
          />
        ) : (
          <PropertyGrid
            properties={properties}
            isLoading={isLoading}
            isError={isError}
            error={error}
            skeletonCount={Math.min(Math.max(savedCount, 1), 8)}
            emptyDescription={ui(
              "The properties you saved are no longer listed.",
            )}
          />
        )}
      </div>
    </div>
  );
}

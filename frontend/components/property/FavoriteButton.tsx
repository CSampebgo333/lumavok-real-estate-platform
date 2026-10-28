"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

import { useIsFavorited, useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

const MotionHeart = motion.create(Heart);

interface FavoriteButtonProps {
  propertyId: string;
  propertyTitle: string;
  /** "sm" sits on top of a card's image; "lg" sits inline on the detail page next to Share/Contact. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Deliberately not nested inside PropertyCard's <Link> — a <button> inside an
 * <a> is invalid HTML and would make the favorite action unreachable as its
 * own accessible control. Rendered as the Link's sibling instead, positioned
 * on top of it (see PropertyCard) — reused as-is on the detail page where
 * there's no surrounding link to conflict with.
 */
export function FavoriteButton({
  propertyId,
  propertyTitle,
  size = "sm",
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isFavorited = useIsFavorited(propertyId);
  const toggle = useToggleFavorite();

  return (
    <button
      type="button"
      disabled={toggle.isPending}
      aria-pressed={isFavorited}
      aria-label={
        isFavorited
          ? `Remove ${propertyTitle} from saved properties`
          : `Save ${propertyTitle}`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isAuthenticated) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        toggle.mutate(propertyId, { onError: error => toast.error(getErrorMessage(error)) });
      }}
      className={cn(
        "focus-visible:ring-ring inline-flex items-center justify-center rounded-full transition-transform duration-150 focus-visible:ring-3 focus-visible:outline-none active:scale-90",
        size === "sm"
          ? "bg-background/90 size-9 shadow-sm backdrop-blur-sm hover:scale-105"
          : "border-border hover:bg-muted size-11 border",
        className,
      )}
    >
      <MotionHeart
        aria-hidden
        initial={false}
        animate={{ scale: isFavorited ? [1, 1.35, 1] : 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "transition-colors duration-200",
          size === "sm" ? "size-4.5" : "size-5",
          isFavorited ? "fill-brand-gold text-brand-gold" : "text-foreground",
        )}
      />
    </button>
  );
}

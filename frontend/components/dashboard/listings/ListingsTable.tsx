"use client";
import { UiText, useUi } from "@/components/common/UiText";

import Image from "next/image";
import Link from "next/link";
import { Building2, MoreHorizontal, Pencil } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PropertyStatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { MOBILE_MEDIA_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { getErrorMessage } from "@/lib/errors";
import { formatListingPrice, formatRelativeTime } from "@/lib/formatters";
import {
  canDeleteListing,
  getAvailableTransitions,
  isPubliclyVisible,
  type StatusTransition,
} from "@/services";
import { useContentLocale } from "@/hooks/useContentLocale";
import type { Property } from "@/types";

const COLUMN_COUNT = 7;

interface ListingsTableProps {
  listings: Property[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onStatusChange: (property: Property, transition: StatusTransition) => void;
  onDeleteRequest: (property: Property) => void;
  /** Listing IDs with a mutation currently in flight — disables that row's action menu. */
  pendingIds: Set<string>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * A native input, not the <Checkbox> wrapper: the indeterminate visual state can
 * only be set imperatively via the DOM property (there's no HTML attribute for
 * it), which needs a direct ref onto the underlying <input>.
 */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ui = useUi();

  return (
    <input
      type="checkbox"
      ref={(node) => {
        if (node) node.indeterminate = indeterminate;
      }}
      checked={checked}
      onChange={onChange}
      aria-label={ui("Select all listings on this page")}
      className="border-border accent-primary focus-visible:ring-ring/50 size-4 shrink-0 rounded-sm border focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}

function RowActions({
  property,
  onStatusChange,
  onDeleteRequest,
  disabled,
}: {
  property: Property;
  onStatusChange: (property: Property, transition: StatusTransition) => void;
  onDeleteRequest: (property: Property) => void;
  disabled: boolean;
}) {
  const ui = useUi();

  const canEdit = isFeatureEnabled("DASHBOARD_PROPERTY_EDITOR");
  const transitions = getAvailableTransitions(property.status);
  const deletable = canDeleteListing(property.status);
  // A draft has no public page, so linking to one sent developers to a 404.
  // `isPubliclyVisible` (services/listing.service.ts) is the single rule both
  // this menu and the mobile card list read.
  const viewable = isPubliclyVisible(property.status);
  // A SOLD listing is terminal, undeletable and off the public site, so its
  // menu would otherwise render as an empty popup. Drop the trigger entirely
  // rather than offer a control with nothing behind it — Edit is a separate,
  // always-present button, so no action is lost.
  const hasMenuActions = viewable || transitions.length > 0 || deletable;

  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit ? (
        <Link
          href={ROUTES.EDIT_LISTING(property.id)}
          aria-label={ui("Edit {{value0}}", { value0: property.title })}
          title={ui("Edit listing")}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          onClick={(event) => {
            // A plain <a> has no `disabled` semantics of its own — this
            // reproduces the same "row action blocked while its own mutation
            // is in flight" behavior the previous Button+render composition
            // got for free from Base UI's disabled handling.
            if (disabled) event.preventDefault();
          }}
          className={buttonVariants({
            variant: "ghost",
            size: "icon-sm",
            className: disabled ? "pointer-events-none opacity-50" : undefined,
          })}
        >
          <Pencil />
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label={ui("Edit {{value0}}", { value0: property.title })}
          title={ui("Edit listing (soon)")}
        >
          <Pencil />
        </Button>
      )}
      {hasMenuActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={ui("Actions for {{value0}}", {
              value0: property.title,
            })}
            disabled={disabled}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {viewable && (
              <DropdownMenuItem
                render={<Link href={ROUTES.PROPERTY_DETAIL(property.slug)} />}
              >
                <UiText text={"View listing"} />{" "}
              </DropdownMenuItem>
            )}
            {viewable && transitions.length > 0 && <DropdownMenuSeparator />}
            {transitions.map((transition) => (
              <DropdownMenuItem
                key={transition.target}
                onClick={() => onStatusChange(property, transition)}
              >
                <UiText text={transition.label} />
              </DropdownMenuItem>
            ))}
            {deletable && (
              <>
                {(viewable || transitions.length > 0) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteRequest(property)}
                >
                  <UiText text={"Delete"} />{" "}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Below `md` the 7-column table only fits ~2 columns on a phone, pushing
 * Status, Last updated and every action behind a horizontal scroll. This
 * renders the same listings as a stacked card list instead — same selection,
 * same thumbnail, and the same `RowActions` component, so
 * getAvailableTransitions/canDeleteListing stay the single source of truth
 * for what each status may do.
 */
function ListingCards({
  listings,
  selectedIds,
  onToggleRow,
  onStatusChange,
  onDeleteRequest,
  pendingIds,
}: {
  listings: Property[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onStatusChange: (property: Property, transition: StatusTransition) => void;
  onDeleteRequest: (property: Property) => void;
  pendingIds: Set<string>;
}) {
  const ui = useUi();
  const { language } = useContentLocale();
  return (
    <ul className="flex flex-col gap-2">
      {listings.map((property) => (
        <li
          key={property.id}
          data-state={selectedIds.has(property.id) ? "selected" : undefined}
          className="border-border data-[state=selected]:bg-muted/50 flex gap-3 rounded-lg border p-3"
        >
          <Checkbox
            checked={selectedIds.has(property.id)}
            onChange={() => onToggleRow(property.id)}
            aria-label={ui("Select {{value0}}", { value0: property.title })}
            className="mt-1 shrink-0"
          />

          <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
            {property.media[0] ? (
              <Image
                src={property.media[0].url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                <Building2 className="size-4" aria-hidden />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Cards have the vertical room the table row didn't, so titles
                  wrap to a second line instead of truncating mid-word. */}
              <span className="line-clamp-2 font-medium">{property.title}</span>
              <PropertyStatusBadge status={property.status} />
            </div>
            <span className="text-muted-foreground truncate text-sm">
              {property.city}, {property.region}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-medium">
                {formatListingPrice(property, language)}
              </span>
              <span className="text-muted-foreground">
                {property.listingType === "SALE"
                  ? ui("For Sale")
                  : ui("For Rent")}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              <UiText text={"Updated"} />{" "}
              {property.updatedAt
                ? formatRelativeTime(property.updatedAt)
                : "—"}
            </span>
          </div>

          <div className="shrink-0">
            <RowActions
              property={property}
              onStatusChange={onStatusChange}
              onDeleteRequest={onDeleteRequest}
              disabled={pendingIds.has(property.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * The My Properties list: bulk-selectable rows, a status-aware action menu per
 * row (only the transitions valid for that listing's current status, plus Delete
 * only when the status allows it), loading skeleton, and both a true-empty and a
 * filtered-to-nothing empty state.
 *
 * Renders a semantic table from `md` up and a card list below it — swapped in
 * JS, not with `hidden`/`md:` classes, so each row's controls and accessible
 * names exist exactly once in the DOM.
 */
export function ListingsTable({
  listings,
  isLoading,
  isError,
  error,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onStatusChange,
  onDeleteRequest,
  pendingIds,
  hasActiveFilters,
  onClearFilters,
}: ListingsTableProps) {
  const ui = useUi();
  const { language } = useContentLocale();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

  if (isError) {
    return (
      <ErrorState
        title={ui("Couldn't load your properties.")}
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return <ListingsTableSkeleton />;
  }

  if (listings.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title={ui("No listings match your filters")}
        description={ui("Try adjusting or clearing your search and filters.")}
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary text-sm font-medium hover:underline"
          >
            <UiText text={"Clear filters"} />{" "}
          </button>
        }
      />
    ) : (
      <EmptyState
        title={ui("No properties yet")}
        description={ui("Properties you add will appear here.")}
      />
    );
  }

  const allSelected =
    listings.length > 0 && listings.every((item) => selectedIds.has(item.id));
  const someSelected = listings.some((item) => selectedIds.has(item.id));

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {/* Visible text matches SelectAllCheckbox's own aria-label verbatim so
            the accessible name still contains the visible label (WCAG 2.5.3). */}
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <SelectAllCheckbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={onToggleAll}
          />
          <UiText text={"Select all listings on this page"} />{" "}
        </label>
        <ListingCards
          listings={listings}
          selectedIds={selectedIds}
          onToggleRow={onToggleRow}
          onStatusChange={onStatusChange}
          onDeleteRequest={onDeleteRequest}
          pendingIds={pendingIds}
        />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={onToggleAll}
            />
          </TableHead>
          <TableHead>
            <UiText text={"Property"} />
          </TableHead>
          <TableHead>
            <UiText text={"Type"} />
          </TableHead>
          <TableHead>
            <UiText text={"Price"} />
          </TableHead>
          <TableHead>
            <UiText text={"Status"} />
          </TableHead>
          <TableHead>
            <UiText text={"Last updated"} />
          </TableHead>
          <TableHead className="px-4 text-right">
            <span className="sr-only">
              <UiText text={"Actions"} />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((property) => (
          <TableRow
            key={property.id}
            data-state={
              selectedIds.has(property.id) ? ui("selected") : undefined
            }
          >
            <TableCell className="px-4">
              <Checkbox
                checked={selectedIds.has(property.id)}
                onChange={() => onToggleRow(property.id)}
                aria-label={ui("Select {{value0}}", { value0: property.title })}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                  {property.media[0] ? (
                    <Image
                      src={property.media[0].url}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                      <Building2 className="size-4" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block max-w-[24ch] truncate font-medium">
                    {property.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {property.city}, {property.region}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {property.listingType === "SALE"
                ? ui("For Sale")
                : ui("For Rent")}
            </TableCell>
            <TableCell>{formatListingPrice(property, language)}</TableCell>
            <TableCell>
              <PropertyStatusBadge status={property.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {property.updatedAt
                ? formatRelativeTime(property.updatedAt)
                : "—"}
            </TableCell>
            <TableCell className="px-4 text-right">
              <RowActions
                property={property}
                onStatusChange={onStatusChange}
                onDeleteRequest={onDeleteRequest}
                disabled={pendingIds.has(property.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ListingsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <span className="sr-only">
              <UiText text={"Select"} />
            </span>
          </TableHead>
          <TableHead>
            <UiText text={"Property"} />
          </TableHead>
          <TableHead>
            <UiText text={"Type"} />
          </TableHead>
          <TableHead>
            <UiText text={"Price"} />
          </TableHead>
          <TableHead>
            <UiText text={"Status"} />
          </TableHead>
          <TableHead>
            <UiText text={"Last updated"} />
          </TableHead>
          <TableHead className="px-4">
            <span className="sr-only">
              <UiText text={"Actions"} />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody role="status" aria-live="polite">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="sr-only">
            <UiText text={"Loading properties…"} />{" "}
          </TableCell>
        </TableRow>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} aria-hidden className="hover:bg-transparent">
            <TableCell className="px-4">
              <Skeleton className="size-4 rounded-sm" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="ml-auto h-7 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

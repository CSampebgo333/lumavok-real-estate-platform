"use client";
import { UiText, useUi } from "@/components/common/UiText";

import { useFormContext } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

const SELECT_CLASSNAME =
  "border-border bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Title, description, category, and Sale/Rent — what the listing fundamentally is. */
export function ListingBasicsSection() {
  const ui = useUi();
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormValues>();

  return (
    <DashboardSection
      title={ui("Basics")}
      description={ui("What you're listing.")}
    >
      <div className="flex flex-col gap-4">
        <FormField
          label={ui("Title")}
          htmlFor="listing-title"
          error={errors.title?.message}
        >
          <Input
            id="listing-title"
            aria-invalid={!!errors.title}
            {...register("title")}
          />
        </FormField>

        <FormField
          label={ui("Description")}
          htmlFor="listing-description"
          error={errors.description?.message}
        >
          <textarea
            id="listing-description"
            rows={4}
            aria-invalid={!!errors.description}
            className="border-border bg-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3 aria-invalid:ring-3"
            {...register("description")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={ui("Category")}
            htmlFor="listing-category"
            error={errors.category?.message}
          >
            <select
              id="listing-category"
              aria-invalid={!!errors.category}
              className={SELECT_CLASSNAME}
              {...register("category")}
            >
              <option value="">
                <UiText text={"Choose a category…"} />
              </option>
              {PROPERTY_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  <UiText text={category.label} />
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={ui("Listing type")}
            htmlFor="listing-type"
            error={errors.listingType?.message}
          >
            <select
              id="listing-type"
              aria-invalid={!!errors.listingType}
              className={SELECT_CLASSNAME}
              {...register("listingType")}
            >
              <option value="">
                <UiText text={"Choose Sale or Rent…"} />
              </option>
              <option value="SALE">
                <UiText text={"For Sale"} />
              </option>
              <option value="RENT">
                <UiText text={"For Rent"} />
              </option>
            </select>
          </FormField>
        </div>
      </div>
    </DashboardSection>
  );
}

import { useUi } from "@/components/common/UiText";

import { UiText } from "@/components/common/UiText";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export interface FilterChip<TKey extends string = string> {
  key: TKey;
  label: string;
}

interface FilterChipsProps<TKey extends string> {
  chips: FilterChip<TKey>[];
  onRemove: (key: TKey) => void;
}

/**
 * Domain-agnostic — each domain (properties, developers) builds its own chip list from its
 * filter shape (see lib/propertyFilters.ts / lib/developerFilters.ts) and passes it in here.
 */
export function FilterChips<TKey extends string>({
  chips,
  onRemove,
}: FilterChipsProps<TKey>) {
  const ui = useUi();
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="outline" className="py-1 pr-1 pl-2">
          <UiText text={chip.label} />
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={ui("Remove {{value0}} filter", {
              value0: ui(chip.label),
            })}
            className="hover:bg-muted rounded-full p-0.5"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
    </div>
  );
}

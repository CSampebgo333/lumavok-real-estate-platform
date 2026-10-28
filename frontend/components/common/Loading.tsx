import { UiText } from "@/components/common/UiText";
export function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center p-8"
    >
      <div className="border-muted-foreground h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      <span className="sr-only">
        <UiText text={"Loading…"} />
      </span>
    </div>
  );
}

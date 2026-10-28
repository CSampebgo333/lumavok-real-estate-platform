import Link from "next/link";
import { UiText } from "@/components/common/UiText";
import { buttonVariants } from "@/components/ui/button";

/** Covers unmatched URLs outside the public route group as well as its pages. */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container-page flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center"
    >
      <h1 className="font-display text-3xl font-semibold">
        <UiText text="Page not found" />
      </h1>
      <p className="text-muted-foreground">
        <UiText text="The page you're looking for doesn't exist or may have been moved." />
      </p>
      <Link href="/" className={buttonVariants()}>
        <UiText text="Back to home" />
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { translateUi } from "@/lib/ui-text";
/** Page metadata is static interface copy. Listing metadata comes from localized API content. */
export async function localizedMetadata(metadata: Metadata): Promise<Metadata> {
  const language =
    (await cookies()).get("lumavok-language")?.value === "en" ? "en" : "fr";
  return {
    ...metadata,
    title:
      typeof metadata.title === "string"
        ? translateUi(metadata.title, language)
        : metadata.title,
    description: metadata.description
      ? translateUi(metadata.description, language)
      : metadata.description,
  };
}

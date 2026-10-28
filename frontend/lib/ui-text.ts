import en from "@/public/locales/en/ui.json";
import fr from "@/public/locales/fr/ui.json";

/** Static interface copy only. Database content uses API translation records. */
export function translateUi(
  text: string,
  language: string,
  values: Record<string, string | number> = {},
): string {
  const dictionary: Record<string, string> = language.startsWith("fr")
    ? fr
    : en;
  return (dictionary[text] ?? text).replace(
    /\{\{(\w+)\}\}/g,
    (match, key: string) =>
      values[key] === undefined ? match : String(values[key]),
  );
}

import en from "@/public/locales/en/ui.json";
import fr from "@/public/locales/fr/ui.json";

/** Static interface copy only. Database content uses API translation records. */
export function translateUi(text: string, language: string): string {
  const dictionary: Record<string, string> = language.startsWith("fr") ? fr : en;
  return dictionary[text] ?? text;
}

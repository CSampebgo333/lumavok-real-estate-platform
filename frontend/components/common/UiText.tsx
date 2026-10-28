"use client";
import { useTranslation } from "react-i18next";
import { translateUi } from "@/lib/ui-text";

export function useUi() {
  const { i18n } = useTranslation();
  return (text: string, values: Record<string, string | number> = {}) =>
    translateUi(text, i18n.resolvedLanguage ?? i18n.language, values);
}
/** A text-only boundary works in server-rendered headings and option labels. */
export function UiText({ text }: { text: string }) {
  const ui = useUi();
  return ui(text);
}

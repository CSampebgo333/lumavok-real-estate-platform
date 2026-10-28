import { describe, expect, it } from "vitest";
import en from "@/public/locales/en/ui.json";
import fr from "@/public/locales/fr/ui.json";
import { translateUi } from "./ui-text";
describe("interface translation contract", () => {
  it("provides the same non-empty keys and placeholders in English and French", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      const translated = (fr as Record<string, string>)[key];
      expect(translated.trim(), key).not.toBe("");
      expect(translated.match(/{{\w+}}/g)?.sort() ?? [], key).toEqual(
        value.match(/{{\w+}}/g)?.sort() ?? [],
      );
    }
  });
  it("translates validation and metadata and interpolates values without changing their identity", () => {
    expect(translateUi("Password is required.", "fr")).toBe(
      "Le mot de passe est obligatoire.",
    );
    expect(translateUi("Properties | Lumavok", "fr")).toBe(
      "Biens immobiliers | Lumavok",
    );
    expect(translateUi("Unknown {{id}}", "en", { id: "p1" })).toBe(
      "Unknown p1",
    );
  });
});

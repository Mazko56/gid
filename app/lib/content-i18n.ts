/** Localized content stored in PostgreSQL. Ukrainian is the canonical original.
 * Missing translations are deliberately not machine-generated on a request: editors
 * can see and complete the missing EN/PL fields in the admin dashboard.
 */
export type ContentLanguage = "uk" | "en" | "pl";
export type TranslatedContent = Record<string, Record<string, string>>;

export function localizedField(
  language: ContentLanguage,
  source: object | null | undefined,
  field: string,
  fallback = "",
): string {
  if (!source) return fallback;
  const fields = source as Record<string, unknown>;
  const translations = fields.translations && typeof fields.translations === "object"
    ? fields.translations as Record<string, unknown> : {};
  const languageFields = translations[language];
  const scoped = languageFields && typeof languageFields === "object"
    ? (languageFields as Record<string, unknown>)[field] : undefined;
  const flat = translations[`${field}_${language}`] ?? fields[`${field}_${language}`];
  const original = fields[field];
  for (const value of [language === "uk" ? original : scoped, language === "uk" ? null : flat, original, fallback]) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export function localizedPageField(
  language: ContentLanguage,
  content: Record<string, string>,
  field: string,
  defaults: Record<ContentLanguage, string>,
): string {
  if (language === "uk") return content[field]?.trim() || defaults.uk;
  // Do not silently replace an editor-provided EN/PL string with an unrelated translation.
  return content[`${field}_${language}`]?.trim() || defaults[language];
}

export function localizedSubcategory(
  language: ContentLanguage,
  category: { subcategories?: string[]; subcategories_i18n?: Record<string, string[]> } | null | undefined,
  sourceName: string,
  knownLabel: (language: ContentLanguage, name: string) => string,
): string {
  if (language === "uk" || !category) return knownLabel(language, sourceName);
  const at = category.subcategories?.indexOf(sourceName) ?? -1;
  if (at >= 0) {
    const translated = category.subcategories_i18n?.[language]?.[at];
    if (translated?.trim()) return translated;
  }
  return knownLabel(language, sourceName);
}

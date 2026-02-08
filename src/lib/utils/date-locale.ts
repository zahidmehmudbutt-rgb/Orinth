import i18n from "i18next";

/**
 * Returns the appropriate locale string for date formatting based on current i18n language.
 */
export function getDateLocale(): string {
  return i18n.language === "ur" ? "ur-PK" : "en-US";
}

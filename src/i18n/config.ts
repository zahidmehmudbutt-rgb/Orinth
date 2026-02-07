import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ur from "./locales/ur.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "app-language",
      caches: ["localStorage"],
    },
  });

// Update document direction and lang attribute when language changes
i18n.on("languageChanged", (lng) => {
  const isUrdu = lng === "ur" || lng.startsWith("ur-");
  document.documentElement.setAttribute("dir", isUrdu ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lng);
});

// Set initial direction
const resolvedLang = i18n.language || "en";
const isUrdu = resolvedLang === "ur" || resolvedLang.startsWith("ur-");
document.documentElement.setAttribute("dir", isUrdu ? "rtl" : "ltr");
document.documentElement.setAttribute("lang", resolvedLang);

export default i18n;

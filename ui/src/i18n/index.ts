import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

const LOCALE_STORAGE_KEY = "paperclip.locale";

function readInitialLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored && supportedLocales.includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: readInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;

export function setLocale(locale: string) {
  if (!supportedLocales.includes(locale)) return;
  void i18n.changeLanguage(locale);
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Language switching still works when storage is unavailable.
  }
}

export { i18n };

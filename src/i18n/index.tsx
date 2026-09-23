import React, { createContext, useContext, useState, useEffect } from "react";
import { zh } from "./locales/zh";
import { en } from "./locales/en";

export type Language = "zh" | "en";

type TranslationDict = typeof zh;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const translations: Record<Language, TranslationDict> = { zh, en };

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("cpa_dashboard_lang") as Language;
    if (saved === "zh" || saved === "en") return saved;
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("cpa_dashboard_lang", lang);
  };

  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split(".");
    let current: any = translations[language] || translations["zh"];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to zh or return keyPath
        let fallback: any = translations["zh"];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== "string") return keyPath;

    if (params) {
      return Object.entries(params).reduce((str, [paramKey, val]) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      }, current);
    }

    return current;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

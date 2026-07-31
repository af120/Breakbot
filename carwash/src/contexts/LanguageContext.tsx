import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getTranslation, isRTL, type Language } from '../i18n';

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  getLocalizedName: (item: any, field: string) => string;
  formatIQD: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('carwash_lang');
    return (saved as Language) || 'ku';
  });

  const dir = isRTL(lang) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('carwash_lang', lang);
  }, [lang, dir]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let text = getTranslation(lang, key);
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [lang]);

  const getLocalizedName = useCallback((item: any, field: string): string => {
    if (!item) return '';
    const localizedKey = `${field}_${lang}`;
    return item[localizedKey] || item[`${field}_en`] || item[`${field}_ku`] || item[`${field}_ar`] || item[field] || '';
  }, [lang]);

  const formatIQD = useCallback((amount: number): string => {
    if (amount == null || isNaN(amount)) return '0 IQD';
    return amount.toLocaleString('en-US') + ' IQD';
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, t, getLocalizedName, formatIQD }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}

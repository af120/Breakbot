import en from './en';
import ar from './ar';
import ku from './ku';

export type Language = 'ku' | 'ar' | 'en';

const translations: Record<Language, Record<string, string>> = { en, ar, ku };

export function getTranslation(lang: Language, key: string): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ku' || lang === 'ar';
}

export const languageNames: Record<Language, string> = {
  ku: 'کوردی',
  ar: 'العربية',
  en: 'English',
};

export default translations;
